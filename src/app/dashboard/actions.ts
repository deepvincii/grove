"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { dropPostgres, provisionPostgres } from "@/lib/shared/addons";
import { query, withTransaction } from "@/lib/shared/db";
import { enqueueDeployment } from "@/lib/shared/deployments";
import { removeAppResources } from "@/lib/shared/docker";
import { defaultBranch, latestCommit } from "@/lib/shared/repos";
import { getAppById, getAppByName, getDeployment } from "@/lib/shared/queries";
import type { App } from "@/lib/shared/types";
import { appNameError, normalizeRepo, parseEnvText } from "@/lib/web/validation";

export interface FormState {
  error?: string;
  success?: string;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optional(formData: FormData, key: string): string | null {
  return text(formData, key) || null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function requireApp(name: string): Promise<App> {
  const app = await getAppByName(name);
  if (!app) throw new Error(`App ${name} not found`);
  return app;
}

/** Restarts the live app with fresh config, reusing its current image. */
async function restartWithNewConfig(app: App): Promise<number | null> {
  if (!app.currentDeploymentId) return null;
  const current = await getDeployment(app.currentDeploymentId);
  if (!current) return null;
  return enqueueDeployment({
    appId: app.id,
    sha: current.commitSha,
    message: current.commitMessage,
    author: current.commitAuthor,
    trigger: "config",
  });
}

export async function createApp(_prev: FormState, formData: FormData): Promise<FormState> {
  const repo = normalizeRepo(text(formData, "repo"));
  if (!repo) return { error: "Pick a repository, or enter owner/name for GitHub or an https URL for another Git host." };

  const name = text(formData, "name").toLowerCase();
  const nameError = appNameError(name);
  if (nameError) return { error: nameError };

  const env = parseEnvText(text(formData, "env"));
  if (env.errors.length > 0) return { error: env.errors.join("\n") };

  let branch = text(formData, "branch");
  let head;
  try {
    if (!branch) branch = await defaultBranch(repo);
    head = await latestCommit(repo, branch);
  } catch (error) {
    return { error: `Couldn't read ${repo}${branch ? `@${branch}` : ""} on GitHub: ${errorMessage(error)}` };
  }

  let appId: number;
  try {
    appId = await withTransaction(async (client) => {
      const { rows } = await client.query<{ id: number }>(
        `INSERT INTO apps (name, repo, branch, auto_deploy, build_command, start_command, release_command, last_seen_sha)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          name,
          repo,
          branch,
          formData.get("autoDeploy") === "on",
          optional(formData, "buildCommand"),
          optional(formData, "startCommand"),
          optional(formData, "releaseCommand"),
          head.sha,
        ],
      );
      for (const [key, value] of Object.entries(env.vars)) {
        await client.query("INSERT INTO env_vars (app_id, key, value) VALUES ($1, $2, $3)", [rows[0].id, key, value]);
      }
      return rows[0].id;
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return { error: `An app called ${name} already exists.` };
    throw error;
  }

  // Provision the database before queueing, so the first deploy already has its variables.
  if (formData.get("postgres") === "on") {
    const app = await getAppById(appId);
    if (app) {
      try {
        await provisionPostgres(app);
      } catch (error) {
        return { error: `The app was created, but its database wasn't: ${errorMessage(error)}` };
      }
    }
  }

  await enqueueDeployment({ appId, sha: head.sha, message: head.message, author: head.author, trigger: "initial" });
  redirect(`/dashboard/apps/${name}`);
}

export async function deployLatest(formData: FormData): Promise<void> {
  const app = await requireApp(text(formData, "name"));
  const head = await latestCommit(app.repo, app.branch);
  await query("UPDATE apps SET last_seen_sha = $2 WHERE id = $1", [app.id, head.sha]);
  const id = await enqueueDeployment({
    appId: app.id,
    sha: head.sha,
    message: head.message,
    author: head.author,
    trigger: "manual",
  });
  redirect(`/dashboard/apps/${app.name}/deployments/${id}`);
}

export async function redeploy(formData: FormData): Promise<void> {
  const source = await getDeployment(Number(text(formData, "deploymentId")));
  if (!source) throw new Error("Deployment not found");
  const app = await getAppById(source.appId);
  if (!app) throw new Error("App not found");

  // Deployments that went live can be restored from their image; anything else is rebuilt.
  const rollback = source.status === "live" || source.status === "superseded";
  const id = await enqueueDeployment({
    appId: app.id,
    sha: source.commitSha,
    message: source.commitMessage,
    author: source.commitAuthor,
    trigger: rollback ? "redeploy" : "manual",
  });
  redirect(`/dashboard/apps/${app.name}/deployments/${id}`);
}

export async function saveEnv(_prev: FormState, formData: FormData): Promise<FormState> {
  const app = await requireApp(text(formData, "name"));
  const env = parseEnvText(text(formData, "env"));
  if (env.errors.length > 0) return { error: env.errors.join("\n") };

  await withTransaction(async (client) => {
    await client.query("DELETE FROM env_vars WHERE app_id = $1", [app.id]);
    for (const [key, value] of Object.entries(env.vars)) {
      await client.query("INSERT INTO env_vars (app_id, key, value) VALUES ($1, $2, $3)", [app.id, key, value]);
    }
  });

  const restarted = await restartWithNewConfig(app);
  refresh();
  return {
    success: restarted ? "Saved. Restarting the app with the new variables." : "Saved. They apply to the next deploy.",
  };
}

export async function addDatabase(formData: FormData): Promise<void> {
  const app = await requireApp(text(formData, "name"));
  await provisionPostgres(app);
  const updated = await getAppById(app.id);
  if (updated) await restartWithNewConfig(updated);
  refresh();
}

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const app = await requireApp(text(formData, "name"));
  const branch = text(formData, "branch");
  if (!branch) return { error: "Branch can't be empty." };
  if (branch !== app.branch) {
    try {
      await latestCommit(app.repo, branch);
    } catch (error) {
      return { error: `Couldn't find branch ${branch}: ${errorMessage(error)}` };
    }
  }

  await query(
    `UPDATE apps
        SET branch = $2, auto_deploy = $3, build_command = $4, start_command = $5, release_command = $6,
            last_seen_sha = CASE WHEN branch = $2 THEN last_seen_sha END,
            github_etag = CASE WHEN branch = $2 THEN github_etag END,
            updated_at = now()
      WHERE id = $1`,
    [
      app.id,
      branch,
      formData.get("autoDeploy") === "on",
      optional(formData, "buildCommand"),
      optional(formData, "startCommand"),
      optional(formData, "releaseCommand"),
    ],
  );
  refresh();
  return {
    success:
      branch !== app.branch
        ? `Saved. Grove will deploy the head of ${branch} in a moment.`
        : "Saved. Changes apply to the next deploy.",
  };
}

export async function deleteApp(_prev: FormState, formData: FormData): Promise<FormState> {
  const app = await requireApp(text(formData, "name"));
  if (text(formData, "confirm") !== app.name) return { error: `Type ${app.name} to confirm.` };

  await removeAppResources(app.name);
  await dropPostgres(app);
  await query("DELETE FROM apps WHERE id = $1", [app.id]);
  redirect("/dashboard");
}

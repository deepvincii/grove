import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { addonEnv } from "@/lib/shared/addons";
import { config } from "@/lib/shared/config";
import { query, queryOne, withTransaction } from "@/lib/shared/db";
import { enqueueDeployment } from "@/lib/shared/deployments";
import {
  containerLogs,
  docker,
  imageExists,
  inspectContainer,
  listContainers,
  removeContainer,
  removeImage,
} from "@/lib/shared/docker";
import { appUrl, shortSha } from "@/lib/shared/format";
import { getGitHubToken } from "@/lib/shared/github";
import { DEPLOYMENT_COLUMNS, getAppById, getEnvVars } from "@/lib/shared/queries";
import { cloneUrl, parseRepo, repoLabel } from "@/lib/shared/repos";
import type { App, Deployment, DeploymentStatus } from "@/lib/shared/types";
import { buildEnvScript, execPrefixed, prepareBuild } from "./buildpack";
import { DeployLog } from "./deploy-log";
import { run, sleep } from "./exec";
import { findFreePort } from "./ports";
import { appsPort, refreshRoutes } from "./proxy";

const IN_FLIGHT: DeploymentStatus[] = ["cloning", "building", "releasing", "starting"];
const IMAGES_KEPT_PER_APP = 5;

class DeployError extends Error {}

function setStatus(id: number, status: DeploymentStatus): Promise<unknown> {
  return query("UPDATE deployments SET status = $2 WHERE id = $1", [id, status]);
}

function envFlags(env: Record<string, string>): string[] {
  // `--env KEY` makes docker read the value from its own environment, so values never
  // show up in process listings.
  return Object.keys(env).flatMap((key) => ["--env", key]);
}

function looksSecret(key: string, value: string): boolean {
  return value.length >= 8 && /SECRET|TOKEN|PASSWORD|PASS|KEY|PRIVATE|DATABASE_URL|CREDENTIAL/i.test(key);
}

/** Only the newest queued deployment of an app is worth building; older ones are cancelled. */
async function claimNextDeployment(): Promise<Deployment | null> {
  const oldest = await queryOne<{ appId: number }>(
    `SELECT app_id AS "appId" FROM deployments WHERE status = 'queued' ORDER BY id LIMIT 1`,
  );
  if (!oldest) return null;

  const newest = await queryOne<{ id: number }>(
    "SELECT id FROM deployments WHERE app_id = $1 AND status = 'queued' ORDER BY id DESC LIMIT 1",
    [oldest.appId],
  );
  if (!newest) return null;
  await query(
    `UPDATE deployments
        SET status = 'cancelled', finished_at = now(), error = 'Skipped in favour of a newer deployment'
      WHERE app_id = $1 AND status = 'queued' AND id < $2`,
    [oldest.appId, newest.id],
  );
  return queryOne<Deployment>(
    `UPDATE deployments d SET status = 'cloning', started_at = now()
      WHERE d.id = $1 AND d.status = 'queued'
      RETURNING ${DEPLOYMENT_COLUMNS}`,
    [newest.id],
  );
}

async function fetchCommit(repo: string, sha: string, dir: string, token: string | null, log: DeployLog) {
  const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" };
  // The GitHub token is only ever sent to github.com.
  const auth =
    token && parseRepo(repo).kind === "github"
      ? ["-c", `http.https://github.com/.extraheader=AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`]
      : [];
  const steps: Array<{ name: string; args: string[] }> = [
    { name: "git init", args: ["init", "--quiet", dir] },
    {
      name: "git fetch",
      args: ["-C", dir, ...auth, "fetch", "--quiet", "--depth", "1", "--no-tags", cloneUrl(repo), sha],
    },
    { name: "git checkout", args: ["-C", dir, "-c", "advice.detachedHead=false", "checkout", "--quiet", "FETCH_HEAD"] },
  ];
  for (const step of steps) {
    const code = await run("git", step.args, { env, onLine: (line) => log.out(line) });
    if (code !== 0) throw new DeployError(`${step.name} failed (exit code ${code})`);
  }
}

/** Hosts other than GitHub are polled with `git ls-remote`, which doesn't return commit details. */
async function recordCommitDetails(deployment: Deployment, dir: string): Promise<void> {
  if (deployment.commitMessage) return;
  const out = await new Promise<string>((resolve) =>
    execFile("git", ["-C", dir, "log", "-1", "--format=%s%x00%an"], (error, stdout) => resolve(error ? "" : stdout)),
  );
  const [message, author] = out.trim().split("\0");
  if (!message) return;
  deployment.commitMessage = message;
  await query("UPDATE deployments SET commit_message = $2, commit_author = $3 WHERE id = $1", [
    deployment.id,
    message,
    author || null,
  ]);
}

/** Redeploys and config changes can reuse the image already built for the same commit. */
async function reusableImage(app: App, deployment: Deployment): Promise<string | null> {
  if (deployment.trigger !== "redeploy" && deployment.trigger !== "config") return null;
  const row = await queryOne<{ image: string }>(
    `SELECT image FROM deployments
      WHERE app_id = $1 AND commit_sha = $2 AND image IS NOT NULL AND status IN ('live', 'superseded')
      ORDER BY id DESC LIMIT 1`,
    [app.id, deployment.commitSha],
  );
  return row && (await imageExists(row.image)) ? row.image : null;
}

async function exposedPort(image: string): Promise<number> {
  const out = await docker(["image", "inspect", "--format", "{{json .Config.ExposedPorts}}", image]).catch(() => "null");
  const ports = Object.keys((JSON.parse(out.trim() || "null") as Record<string, unknown> | null) ?? {})
    .map((port) => Number.parseInt(port, 10))
    .filter(Number.isFinite);
  return ports[0] ?? 3000;
}

async function usedHostPorts(): Promise<Set<number>> {
  const rows = await query<{ port: number }>(
    "SELECT host_port AS port FROM deployments WHERE host_port IS NOT NULL AND status IN ('starting', 'live')",
  );
  return new Set(rows.map((row) => row.port));
}

function respondsToHttp(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const request = http.get({ host: "127.0.0.1", port, path: "/", timeout: 2000 }, (response) => {
      response.resume();
      resolve(true);
    });
    request.on("timeout", () => request.destroy());
    request.on("error", () => resolve(false));
  });
}

async function copyContainerLogs(name: string, log: DeployLog, lines = 40): Promise<void> {
  const output = await containerLogs(name, lines).catch(() => []);
  if (output.length === 0) return;
  log.step("App output:");
  for (const line of output) log.out(line);
}

async function waitUntilHealthy(name: string, hostPort: number, log: DeployLog): Promise<void> {
  const deadline = Date.now() + config.healthTimeoutMs;
  while (Date.now() < deadline) {
    const state = await inspectContainer(name);
    if (!state) throw new DeployError("The container disappeared while starting");
    if (!state.running || state.restarting || state.restartCount > 0) {
      await copyContainerLogs(name, log);
      throw new DeployError(`The app crashed while starting (exit code ${state.exitCode}). See its output above.`);
    }
    if (await respondsToHttp(hostPort)) return;
    await sleep(750);
  }
  await copyContainerLogs(name, log);
  throw new DeployError(
    `The app didn't answer HTTP requests within ${Math.round(config.healthTimeoutMs / 1000)}s. Make sure it listens on process.env.PORT.`,
  );
}

async function promote(appId: number, deploymentId: number): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("UPDATE deployments SET status = 'superseded' WHERE app_id = $1 AND status = 'live'", [appId]);
    await client.query("UPDATE deployments SET status = 'live', finished_at = now() WHERE id = $1", [deploymentId]);
    await client.query("UPDATE apps SET current_deployment_id = $2, updated_at = now() WHERE id = $1", [
      appId,
      deploymentId,
    ]);
  });
  await refreshRoutes();
}

async function retireOldContainers(appName: string, keep: string): Promise<void> {
  const names = await listContainers(`grove.app=${appName}`);
  await Promise.all(names.filter((name) => name !== keep).map((name) => removeContainer(name)));
}

async function pruneImages(appId: number): Promise<void> {
  const rows = await query<{ image: string }>(
    "SELECT image FROM deployments WHERE app_id = $1 AND image IS NOT NULL ORDER BY id DESC",
    [appId],
  );
  const keep = new Set(rows.slice(0, IMAGES_KEPT_PER_APP).map((row) => row.image));
  const stale = new Set(rows.slice(IMAGES_KEPT_PER_APP).map((row) => row.image).filter((image) => !keep.has(image)));
  for (const image of stale) await removeImage(image);
}

async function deploy(deployment: Deployment): Promise<void> {
  const app = await getAppById(deployment.appId);
  if (!app) return;

  const { token } = await getGitHubToken();
  const env = { ...addonEnv(app), ...(await getEnvVars(app.id)) };
  const secrets = [token, ...Object.entries(env).filter(([key, value]) => looksSecret(key, value)).map(([, value]) => value)];
  const log = new DeployLog(deployment.id, secrets);
  let workdir: string | null = null;
  let buildEnvFile: string | null = null;
  let containerName: string | null = null;

  try {
    log.step(
      `Deploying ${repoLabel(app.repo)}@${shortSha(deployment.commitSha)}${deployment.commitMessage ? ` · ${deployment.commitMessage}` : ""}`,
    );

    let image = await reusableImage(app, deployment);
    if (image) {
      log.step(`Reusing the image already built for this commit (${image})`);
    } else {
      workdir = await mkdtemp(path.join(os.tmpdir(), `grove-${app.name}-`));
      log.step(`Fetching ${shortSha(deployment.commitSha)} from ${cloneUrl(app.repo).replace(/\.git$/, "")}`);
      await fetchCommit(app.repo, deployment.commitSha, workdir, token, log);
      await recordCommitDetails(deployment, workdir);

      await setStatus(deployment.id, "building");
      const plan = await prepareBuild(workdir, app);
      log.step(plan.summary);
      image = `grove/${app.name}:${deployment.id}`;

      // Env vars reach the build as a secret file (generated Dockerfile) or as build args (the repo's own
      // Dockerfile), so values like NEXT_PUBLIC_* are there at build time without ending up in the image.
      const buildEnv = { ...env, GROVE_COMMIT_SHA: deployment.commitSha };
      buildEnvFile = path.join(os.tmpdir(), `grove-build-env-${deployment.id}`);
      await writeFile(buildEnvFile, buildEnvScript(buildEnv), { mode: 0o600 });
      const buildArgs = plan.generated ? [] : Object.keys(buildEnv).flatMap((key) => ["--build-arg", key]);
      const code = await run(
        "docker",
        [
          "build",
          "--progress=plain",
          "--secret",
          `id=grove_env,src=${buildEnvFile}`,
          ...buildArgs,
          "--tag",
          image,
          "--file",
          plan.dockerfile,
          workdir,
        ],
        {
          env: { ...process.env, ...buildEnv },
          onLine: (line) => {
            if (!line.startsWith("View build details:")) log.out(line);
          },
        },
      );
      if (code !== 0) throw new DeployError(`docker build failed (exit code ${code})`);
      log.step(`Built image ${image}`);
    }
    await query("UPDATE deployments SET image = $2 WHERE id = $1", [deployment.id, image]);

    const containerPort = await exposedPort(image);
    const runtimeEnv = {
      ...env,
      PORT: String(containerPort),
      GROVE_APP_NAME: app.name,
      GROVE_COMMIT_SHA: deployment.commitSha,
      GROVE_DEPLOYMENT_ID: String(deployment.id),
    };
    const dockerEnv = { ...process.env, ...runtimeEnv };
    const common = ["--network", config.dockerNetwork, "--add-host", "host.docker.internal:host-gateway", ...envFlags(runtimeEnv)];

    if (app.releaseCommand) {
      await setStatus(deployment.id, "releasing");
      log.step(`Running release command: ${app.releaseCommand}`);
      const code = await run("docker", ["run", "--rm", ...common, image, "sh", "-c", app.releaseCommand], {
        env: dockerEnv,
        onLine: (line) => log.out(line),
      });
      if (code !== 0) throw new DeployError(`Release command failed (exit code ${code})`);
    }

    await setStatus(deployment.id, "starting");
    const hostPort = await findFreePort(await usedHostPorts());
    containerName = `grove-${app.name}-${deployment.id}`;
    log.step(`Starting container ${containerName}`);
    await docker(
      [
        "run",
        "--detach",
        "--name",
        containerName,
        "--init",
        "--restart",
        "unless-stopped",
        "--publish",
        `127.0.0.1:${hostPort}:${containerPort}`,
        "--label",
        `grove.app=${app.name}`,
        "--label",
        `grove.deployment=${deployment.id}`,
        ...common,
        image,
        ...(app.startCommand ? ["sh", "-c", execPrefixed(app.startCommand)] : []),
      ],
      { env: dockerEnv },
    );
    await query("UPDATE deployments SET container_name = $2, host_port = $3 WHERE id = $1", [
      deployment.id,
      containerName,
      hostPort,
    ]);

    log.step(`Waiting for the app to answer on port ${containerPort}`);
    await waitUntilHealthy(containerName, hostPort, log);
    await copyContainerLogs(containerName, log, 15);

    log.step(`Live at ${appUrl(app.name, appsPort())}`);
    await log.flush();
    await promote(app.id, deployment.id);
    const live = containerName;
    containerName = null;
    await retireOldContainers(app.name, live);
    await pruneImages(app.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(message);
    await log.flush();
    if (containerName) await removeContainer(containerName, 1);
    await query("UPDATE deployments SET status = 'failed', error = $2, finished_at = now() WHERE id = $1", [
      deployment.id,
      message.slice(0, 1000),
    ]);
  } finally {
    await log.flush();
    if (buildEnvFile) await rm(buildEnvFile, { force: true }).catch(() => undefined);
    if (workdir) await rm(workdir, { recursive: true, force: true }).catch(() => undefined);
  }
}

/** Deployments that were mid-flight when the runner stopped can't be resumed; fail them. */
export async function recoverInterruptedDeployments(): Promise<void> {
  const rows = await query<{ id: number; containerName: string | null }>(
    `UPDATE deployments
        SET status = 'failed', error = 'Grove stopped during this deployment', finished_at = now()
      WHERE status = ANY($1::text[])
      RETURNING id, container_name AS "containerName"`,
    [IN_FLIGHT],
  );
  for (const row of rows) {
    const log = new DeployLog(row.id);
    log.error("Grove stopped during this deployment. Redeploy to try again.");
    await log.flush();
    if (row.containerName) await removeContainer(row.containerName, 1);
  }
}

/** After a reboot, restart stopped app containers and redeploy any that were removed. */
export async function restoreLiveContainers(): Promise<void> {
  const live = await query<Deployment & { appName: string }>(
    `SELECT ${DEPLOYMENT_COLUMNS}, a.name AS "appName"
       FROM deployments d JOIN apps a ON a.current_deployment_id = d.id
      WHERE d.status = 'live'`,
  );
  for (const deployment of live) {
    if (!deployment.containerName) continue;
    const state = await inspectContainer(deployment.containerName);
    if (state?.running) continue;
    if (state) {
      console.log(`${deployment.appName}: starting its stopped container`);
      await docker(["start", deployment.containerName]).catch((error: Error) =>
        console.error(`couldn't start ${deployment.containerName}: ${error.message}`),
      );
      continue;
    }
    console.log(`${deployment.appName}: container is gone, redeploying ${shortSha(deployment.commitSha)}`);
    await enqueueDeployment({
      appId: deployment.appId,
      sha: deployment.commitSha,
      message: deployment.commitMessage,
      author: deployment.commitAuthor,
      trigger: "redeploy",
    });
  }
}

export async function runWorker(isStopping: () => boolean): Promise<void> {
  while (!isStopping()) {
    const deployment = await claimNextDeployment().catch((error: Error) => {
      console.error("couldn't read the queue:", error.message);
      return null;
    });
    if (deployment) await deploy(deployment);
    else await sleep(1000);
  }
}

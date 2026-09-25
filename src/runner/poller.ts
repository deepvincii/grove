import { query } from "@/lib/db";
import { enqueueDeployment } from "@/lib/deployments";
import { shortSha } from "@/lib/format";
import { GitHubError } from "@/lib/github";
import { APP_COLUMNS } from "@/lib/queries";
import { branchHead, commitInfo } from "@/lib/repos";
import type { App } from "@/lib/types";

let pausedUntil = 0;

async function pollApp(app: App): Promise<void> {
  const head = await branchHead(app.repo, app.branch, app.githubEtag);
  if (head.kind === "unchanged") {
    if (app.pollError) await query("UPDATE apps SET poll_error = NULL WHERE id = $1", [app.id]);
    return;
  }
  if (head.sha === app.lastSeenSha) {
    if (app.pollError || head.etag !== app.githubEtag) {
      await query("UPDATE apps SET github_etag = $2, poll_error = NULL WHERE id = $1", [app.id, head.etag]);
    }
    return;
  }

  await query("UPDATE apps SET last_seen_sha = $2, github_etag = $3, poll_error = NULL WHERE id = $1", [
    app.id,
    head.sha,
    head.etag,
  ]);
  const commit = await commitInfo(app.repo, head.sha);
  const id = await enqueueDeployment({
    appId: app.id,
    sha: head.sha,
    message: commit?.message,
    author: commit?.author,
    trigger: "push",
  });
  if (id) console.log(`[poller] ${app.name}: new commit ${shortSha(head.sha)} on ${app.branch} → deployment #${id}`);
}

async function pollAll(): Promise<void> {
  if (Date.now() < pausedUntil) return;
  const apps = await query<App>(`SELECT ${APP_COLUMNS} FROM apps a WHERE a.auto_deploy ORDER BY a.id`);

  for (const app of apps) {
    try {
      await pollApp(app);
    } catch (error) {
      let message = error instanceof Error ? error.message : String(error);
      if (error instanceof GitHubError && error.retryAt) {
        pausedUntil = error.retryAt.getTime();
        message = `${message}. Checking again at ${error.retryAt.toLocaleTimeString()}.`;
      }
      if (message !== app.pollError) {
        await query("UPDATE apps SET poll_error = $2 WHERE id = $1", [app.id, message]);
      }
      if (Date.now() < pausedUntil) return;
    }
  }
}

/** Asks each auto-deploy app's Git host for its branch head and queues a deployment when it moves. */
export function startPoller(intervalMs: number, isStopping: () => boolean): void {
  const tick = async () => {
    if (isStopping()) return;
    await pollAll().catch((error: Error) => console.error("[poller]", error.message));
    setTimeout(() => void tick(), intervalMs);
  };
  void tick();
}

import "@/lib/shared/env";
import { config } from "@/lib/shared/config";
import { query } from "@/lib/shared/db";
import { docker } from "@/lib/shared/docker";
import { getGitHubToken, getViewerLogin } from "@/lib/shared/github";
import { sleep } from "./exec";
import { startPoller } from "./poller";
import { startProxy } from "./proxy";
import { recoverInterruptedDeployments, restoreLiveContainers, runWorker } from "./worker";

let stopping = false;

async function waitFor(what: string, check: () => Promise<unknown>): Promise<void> {
  for (let attempt = 0; ; attempt++) {
    try {
      await check();
      return;
    } catch (error) {
      if (attempt % 10 === 0) {
        console.log(`waiting for ${what} (${error instanceof Error ? error.message.split("\n")[0] : error})`);
      }
      await sleep(2000);
    }
  }
}

async function ensureNetwork(): Promise<void> {
  try {
    await docker(["network", "inspect", config.dockerNetwork]);
  } catch {
    await docker(["network", "create", config.dockerNetwork]);
  }
}

async function main(): Promise<void> {
  console.log("starting");
  await waitFor("Postgres (is `docker compose up` running?)", () => query("SELECT 1"));
  await waitFor("Docker (is Docker Desktop running?)", () => docker(["info", "--format", "{{.ServerVersion}}"]));
  await ensureNetwork();

  const { source } = await getGitHubToken();
  const githubUser = await getViewerLogin().catch(() => null);
  console.log(
    githubUser
      ? `GitHub: signed in as ${githubUser} (token from ${source === "env" ? "GITHUB_TOKEN" : "the gh CLI"})`
      : "GitHub: no token found, so only public repos will work. Run `gh auth login` or set GITHUB_TOKEN.",
  );

  const appsPort = await startProxy();
  console.log(`apps are served at http://<app>.localhost${appsPort === 80 ? "" : `:${appsPort}`}`);

  const heartbeat = () =>
    query(
      `INSERT INTO runner_heartbeat (id, seen_at, apps_port, poll_interval_ms, github_user)
       VALUES (1, now(), $1, $2, $3)
       ON CONFLICT (id) DO UPDATE
         SET seen_at = excluded.seen_at, apps_port = excluded.apps_port,
             poll_interval_ms = excluded.poll_interval_ms, github_user = excluded.github_user`,
      [appsPort, config.pollIntervalMs, githubUser],
    ).catch((error: Error) => console.error("heartbeat failed:", error.message));
  await heartbeat();
  setInterval(() => void heartbeat(), 5000);

  await recoverInterruptedDeployments();
  await restoreLiveContainers();
  startPoller(config.pollIntervalMs, () => stopping);
  console.log(`watching GitHub every ${config.pollIntervalMs / 1000}s`);
  await runWorker(() => stopping);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    stopping = true;
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("fatal:", error);
  process.exit(1);
});
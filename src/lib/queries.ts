import { query, queryOne } from "./db";
import type { App, AppSummary, Deployment, Heartbeat, LogLine } from "./types";

export const APP_COLUMNS = `
  a.id, a.name, a.repo, a.branch, a.auto_deploy AS "autoDeploy",
  a.build_command AS "buildCommand", a.start_command AS "startCommand",
  a.release_command AS "releaseCommand", a.database_name AS "databaseName",
  a.database_password AS "databasePassword", a.last_seen_sha AS "lastSeenSha",
  a.github_etag AS "githubEtag", a.poll_error AS "pollError",
  a.current_deployment_id AS "currentDeploymentId", a.created_at AS "createdAt",
  a.updated_at AS "updatedAt"`;

export const DEPLOYMENT_COLUMNS = `
  d.id, d.app_id AS "appId", d.commit_sha AS "commitSha", d.commit_message AS "commitMessage",
  d.commit_author AS "commitAuthor", d.trigger, d.status, d.image,
  d.container_name AS "containerName", d.host_port AS "hostPort", d.error,
  d.created_at AS "createdAt", d.started_at AS "startedAt", d.finished_at AS "finishedAt"`;

export async function listApps(): Promise<AppSummary[]> {
  const [apps, latest, current] = await Promise.all([
    query<App>(`SELECT ${APP_COLUMNS} FROM apps a ORDER BY a.created_at DESC`),
    query<Deployment>(
      `SELECT DISTINCT ON (d.app_id) ${DEPLOYMENT_COLUMNS} FROM deployments d ORDER BY d.app_id, d.id DESC`,
    ),
    query<Deployment>(
      `SELECT ${DEPLOYMENT_COLUMNS} FROM deployments d JOIN apps a ON a.current_deployment_id = d.id`,
    ),
  ]);
  const latestByApp = new Map(latest.map((d) => [d.appId, d]));
  const currentByApp = new Map(current.map((d) => [d.appId, d]));
  return apps.map((app) => ({
    ...app,
    latest: latestByApp.get(app.id) ?? null,
    current: currentByApp.get(app.id) ?? null,
  }));
}

export function getAppByName(name: string): Promise<App | null> {
  return queryOne<App>(`SELECT ${APP_COLUMNS} FROM apps a WHERE a.name = $1`, [name]);
}

export function getAppById(id: number): Promise<App | null> {
  return queryOne<App>(`SELECT ${APP_COLUMNS} FROM apps a WHERE a.id = $1`, [id]);
}

export function listDeployments(appId: number, limit = 25): Promise<Deployment[]> {
  return query<Deployment>(
    `SELECT ${DEPLOYMENT_COLUMNS} FROM deployments d WHERE d.app_id = $1 ORDER BY d.id DESC LIMIT $2`,
    [appId, limit],
  );
}

export function getDeployment(id: number): Promise<Deployment | null> {
  return queryOne<Deployment>(`SELECT ${DEPLOYMENT_COLUMNS} FROM deployments d WHERE d.id = $1`, [id]);
}

export async function getEnvVars(appId: number): Promise<Record<string, string>> {
  const rows = await query<{ key: string; value: string }>(
    "SELECT key, value FROM env_vars WHERE app_id = $1 ORDER BY key",
    [appId],
  );
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function getLogsAfter(deploymentId: number, afterId: number, limit = 2000): Promise<LogLine[]> {
  return query<LogLine>(
    `SELECT id, kind, line, created_at AS "createdAt"
       FROM deployment_logs
      WHERE deployment_id = $1 AND id > $2
      ORDER BY id
      LIMIT $3`,
    [deploymentId, afterId, limit],
  );
}

export function getHeartbeat(): Promise<Heartbeat | null> {
  return queryOne<Heartbeat>(
    `SELECT seen_at AS "seenAt", apps_port AS "appsPort", poll_interval_ms AS "pollIntervalMs",
            github_user AS "githubUser"
       FROM runner_heartbeat WHERE id = 1`,
  );
}

/** The runner writes a heartbeat every few seconds; treat it as offline after 15s of silence. */
export function isRunnerOnline(heartbeat: Heartbeat | null): boolean {
  return heartbeat !== null && Date.now() - heartbeat.seenAt.getTime() < 15_000;
}

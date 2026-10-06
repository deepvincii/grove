function intFromEnv(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const config = {
  databaseUrl: process.env.DATABASE_URL || "postgres://grove:grove@127.0.0.1:54329/grove",
  dashboardPort: intFromEnv("DASHBOARD_PORT", 3030),
  /** Ports the runner tries, in order, for serving apps at http://<app>.localhost[:port]. */
  appsPorts: process.env.APPS_PORT ? [intFromEnv("APPS_PORT", 80)] : [80, 3080],
  pollIntervalMs: intFromEnv("POLL_INTERVAL_MS", 5000),
  /** Docker network shared by deployed apps and the add-on Postgres (see docker-compose.yml). */
  dockerNetwork: process.env.DOCKER_NETWORK || "grove",
  addonPostgresHost: process.env.ADDON_POSTGRES_HOST || "grove-postgres",
  addonPostgresPort: 5432,
  healthTimeoutMs: intFromEnv("HEALTH_TIMEOUT_MS", 90_000),
};

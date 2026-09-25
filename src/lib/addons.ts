import { randomBytes } from "node:crypto";
import { config } from "./config";
import { query } from "./db";
import type { App } from "./types";

function databaseIdent(appName: string): string {
  const ident = `app_${appName.replaceAll("-", "_")}`;
  // App names are validated, but these identifiers go straight into DDL, so check again.
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(ident)) throw new Error(`Invalid database name for ${appName}`);
  return ident;
}

/** Creates a dedicated role and database for the app inside Grove's own Postgres. */
export async function provisionPostgres(app: App): Promise<void> {
  if (app.databaseName) return;
  const ident = databaseIdent(app.name);
  const password = randomBytes(18).toString("base64url");

  await query(`DROP DATABASE IF EXISTS ${ident} WITH (FORCE)`);
  await query(`DROP ROLE IF EXISTS ${ident}`);
  await query(`CREATE ROLE ${ident} LOGIN PASSWORD '${password}'`);
  await query(`CREATE DATABASE ${ident} OWNER ${ident}`);
  await query("UPDATE apps SET database_name = $2, database_password = $3, updated_at = now() WHERE id = $1", [
    app.id,
    ident,
    password,
  ]);
}

export async function dropPostgres(app: App): Promise<void> {
  if (!app.databaseName) return;
  const ident = databaseIdent(app.name);
  await query(`DROP DATABASE IF EXISTS ${ident} WITH (FORCE)`);
  await query(`DROP ROLE IF EXISTS ${ident}`);
}

/** Connection variables injected into the app when it has a database. */
export function addonEnv(app: App): Record<string, string> {
  if (!app.databaseName || !app.databasePassword) return {};
  const host = config.addonPostgresHost;
  const port = String(config.addonPostgresPort);
  const user = app.databaseName;
  const password = app.databasePassword;
  const database = app.databaseName;
  return {
    DATABASE_URL: `postgres://${user}:${password}@${host}:${port}/${database}`,
    PGHOST: host,
    PGPORT: port,
    PGUSER: user,
    PGPASSWORD: password,
    PGDATABASE: database,
    DB_HOST: host,
    DB_PORT: port,
    DB_USER: user,
    DB_PASSWORD: password,
    DB_NAME: database,
  };
}

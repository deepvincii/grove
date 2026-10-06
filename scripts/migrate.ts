import "../src/lib/shared/env";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { config } from "../src/lib/shared/config";

const migrationsDir = path.join(process.cwd(), "db", "migrations");
const client = new pg.Client({ connectionString: config.databaseUrl });

try {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await client.query<{ name: string }>("SELECT name FROM schema_migrations");
  const applied = new Set(rows.map((row) => row.name));
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`Applied migration ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} catch (error) {
  console.error("Migration failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}

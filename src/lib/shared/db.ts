import pg from "pg";
import { config } from "./config";

// BIGINT ids and counts come back as strings by default; they all fit in a JS number here.
pg.types.setTypeParser(pg.types.builtins.INT8, (value: string) => Number.parseInt(value, 10));

const globalForDb = globalThis as unknown as { grovePool?: pg.Pool };

function getPool(): pg.Pool {
  if (!globalForDb.grovePool) {
    const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 5 });
    pool.on("error", (error) => console.error("[db] idle client error:", error.message));
    globalForDb.grovePool = pool;
  }
  return globalForDb.grovePool;
}

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

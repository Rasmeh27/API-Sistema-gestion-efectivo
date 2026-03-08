import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { env } from "../src/config/env";

let pool: Pool | null = null;

function buildPool(): Pool {
  return new Pool({
    connectionString: env.databaseUrl,
    max: env.dbPoolMax,
    idleTimeoutMillis: env.dbIdleTimeoutMs,
    connectionTimeoutMillis: env.dbConnectionTimeoutMs,
    ssl: env.dbSsl
      ? {
          rejectUnauthorized: false,
        }
      : false,
  });
}

export function getPool(): Pool {
  if (!pool) {
    pool = buildPool();
  }

  return pool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: readonly unknown[] = []
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, [...params]);
}

export async function withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function pingDatabase(): Promise<void> {
  await query("select 1");
}

export async function closeDatabase(): Promise<void> {
  if (!pool) {
    return;
  }

  await pool.end();
  pool = null;
}
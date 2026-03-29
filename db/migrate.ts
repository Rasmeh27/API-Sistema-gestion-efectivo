// db/migrate.ts
//
// Lightweight migration runner.
// - Reads .sql files from db/migrations/ in alphabetical order
// - Tracks applied migrations in a `_migrations` table
// - Executes only pending migrations, each inside its own transaction
// - Can be run standalone (`npx tsx db/migrate.ts`) or imported

import fs from "fs";
import path from "path";
import { getPool, query } from "./index";

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

// Migrations that were applied manually before the _migrations table existed.
// These will be recorded as applied without re-executing.
const BASELINE_MIGRATIONS = [
  "20260307_001_usuario_credencial.sql",
  "20260322_002_atm_cajaid_fundrequest_moneda.sql",
  "20260324_003_sucursal_coordenadas.sql",
  "20260324_004_recomendacion.sql",
  "20260327_005_sucursal_telefono_direccion_atm.sql",
];

async function ensureMigrationsTable(): Promise<void> {
  await query(`
    create table if not exists _migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `);
}

async function recordBaseline(): Promise<void> {
  for (const name of BASELINE_MIGRATIONS) {
    await query(
      `insert into _migrations (name) values ($1) on conflict (name) do nothing`,
      [name]
    );
  }
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const { rows } = await query<{ name: string }>(
    `select name from _migrations order by name`
  );
  return new Set(rows.map((r) => r.name));
}

function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

export async function runMigrations(): Promise<void> {
  await ensureMigrationsTable();
  await recordBaseline();

  const applied = await getAppliedMigrations();
  const files = getMigrationFiles();
  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log("[migrate] all migrations up to date");
    return;
  }

  console.log(`[migrate] ${pending.length} pending migration(s)`);

  for (const file of pending) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    const client = await getPool().connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        `insert into _migrations (name) values ($1)`,
        [file]
      );
      await client.query("COMMIT");
      console.log(`[migrate] applied: ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`[migrate] FAILED: ${file}`);
      throw error;
    } finally {
      client.release();
    }
  }

  console.log("[migrate] done");
}

// Allow standalone execution: `npx tsx db/migrate.ts`
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

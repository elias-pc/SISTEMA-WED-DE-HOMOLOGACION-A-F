import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { config } from '../config.js';
const { Pool } = pg;
const pool = new Pool({ connectionString: config.databaseUrlUnpooled, max: 1, connectionTimeoutMillis: 10_000, ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined });
const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
const sourceDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../server/db/migrations');
async function migrate() {
  await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  const migrationDirectory = await readdir(directory).then(() => directory).catch(() => sourceDirectory);
  for (const filename of (await readdir(migrationDirectory)).filter((file) => file.endsWith('.sql')).sort()) {
    if ((await pool.query('SELECT 1 FROM schema_migrations WHERE filename=$1', [filename])).rowCount) continue;
    const client = await pool.connect();
    try { await client.query('BEGIN'); await client.query(await readFile(path.join(migrationDirectory, filename), 'utf8')); await client.query('INSERT INTO schema_migrations(filename) VALUES($1)', [filename]); await client.query('COMMIT'); console.log(`Migración aplicada: ${filename}`); }
    catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
  }
}
migrate().finally(() => pool.end());

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './pool.js';
const directory = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');
async function migrate() {
    await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const filename of (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort()) {
        if ((await pool.query('SELECT 1 FROM schema_migrations WHERE filename=$1', [filename])).rowCount)
            continue;
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(await readFile(path.join(directory, filename), 'utf8'));
            await client.query('INSERT INTO schema_migrations(filename) VALUES($1)', [filename]);
            await client.query('COMMIT');
            console.log(`Migración aplicada: ${filename}`);
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
}
migrate().finally(() => pool.end());

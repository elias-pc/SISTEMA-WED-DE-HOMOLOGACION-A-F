import { app } from './app.js';
import { config } from './config.js';
import { pool } from './db/pool.js';
import { config as runtimeConfig } from './config.js';
const server=app.listen(config.port,'127.0.0.1',()=>console.log(`API disponible en http://127.0.0.1:${config.port}`));
async function shutdown(){server.close();if(!runtimeConfig.useMemoryDatabase)await pool.end();process.exit(0)}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);

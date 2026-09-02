import { createRequire } from 'node:module';
import type { Express } from 'express';

// Vercel carga el backend ya compilado por `npm run build`.
// Así la función y el servidor comparten exactamente el mismo artefacto.
const require = createRequire(import.meta.url);
const { app } = require('../server-dist/app.js') as { app: Express };

export default app;

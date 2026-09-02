import type { Express } from 'express';

// Vercel carga el backend ya compilado por `npm run build`.
// Así la función y el servidor comparten exactamente el mismo artefacto.
// @ts-expect-error El archivo JavaScript se genera antes de empaquetar la función.
import { app as compiledApp } from '../server-dist/app.js';

const app = compiledApp as Express;

export default app;

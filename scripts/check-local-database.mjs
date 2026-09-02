import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
const localHosts = new Set(['localhost', '127.0.0.1', '::1']);

if (!databaseUrl) {
  console.error('DATABASE_URL es obligatoria para una prueba local con PostgreSQL. Copia .env.example como .env.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.VERCEL_URL) {
  console.error('Este comando solo se puede ejecutar fuera de Vercel y con NODE_ENV distinto de production.');
  process.exit(1);
}

try {
  const host = new URL(databaseUrl).hostname;
  if (!localHosts.has(host)) {
    console.error(`DATABASE_URL apunta a ${host}, que no es una base local. Se cancela para proteger los datos desplegados.`);
    process.exit(1);
  }
} catch {
  console.error('DATABASE_URL no tiene un formato PostgreSQL válido.');
  process.exit(1);
}

console.log('Base de datos local confirmada. Se pueden ejecutar migraciones y datos de prueba.');

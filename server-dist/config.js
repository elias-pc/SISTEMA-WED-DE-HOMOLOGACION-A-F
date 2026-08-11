import 'dotenv/config';
const deployedOrigins = [
    process.env.APP_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
];
export const config = {
    port: Number(process.env.PORT || 3001),
    databaseUrl: process.env.DATABASE_URL || 'postgresql://af_user:af_password@127.0.0.1:5432/af_homologacion',
    appOrigin: process.env.APP_ORIGIN || 'http://localhost:4173',
    isProduction: process.env.NODE_ENV === 'production',
    sessionTtlHours: Number(process.env.SESSION_TTL_HOURS || 12),
    useMemoryDatabase: !process.env.DATABASE_URL && process.env.NODE_ENV !== 'production',
    allowedOrigins: [
        ...deployedOrigins,
        ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:4173', 'http://127.0.0.1:4173']),
    ].filter((origin) => Boolean(origin)),
};

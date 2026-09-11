import { config as loadEnv } from 'dotenv';
// El servidor no es Next.js: carga explícitamente los overrides locales sin
// exponerlos al repositorio ni a los despliegues.
loadEnv({ path: '.env.development.local' });
loadEnv({ path: '.env.local' });
loadEnv();
const deployedOrigins = [
    process.env.APP_ORIGIN,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined,
];
export const config = {
    port: Number(process.env.PORT || 3001),
    databaseUrl: process.env.DATABASE_URL || 'postgresql://af_user:af_password@127.0.0.1:5432/af_homologacion',
    databaseUrlUnpooled: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || 'postgresql://af_user:af_password@127.0.0.1:5432/af_homologacion',
    databaseSsl: process.env.DATABASE_SSL === 'true',
    appOrigin: process.env.APP_ORIGIN || 'http://localhost:4173',
    isProduction: process.env.NODE_ENV === 'production',
    sessionTtlHours: Number(process.env.SESSION_TTL_HOURS || 12),
    useMemoryDatabase: !process.env.DATABASE_URL && process.env.NODE_ENV !== 'production',
    documentStorageDriver: process.env.DOCUMENT_STORAGE_DRIVER || 'local',
    documentStoragePath: process.env.DOCUMENT_STORAGE_PATH || './data/uploads',
    notificationsProvider: process.env.NOTIFICATIONS_PROVIDER || 'disabled',
    whatsappEnabled: process.env.WHATSAPP_ENABLED === 'true',
    cronSecret: process.env.CRON_SECRET || '',
    whatsapp: {
        graphApiVersion: process.env.WHATSAPP_GRAPH_API_VERSION || '',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
        appSecret: process.env.WHATSAPP_APP_SECRET || '',
    },
    allowedOrigins: [
        ...deployedOrigins,
        ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:4173', 'http://127.0.0.1:4173']),
    ].filter((origin) => Boolean(origin)),
};
export function validateNotificationConfiguration() {
    if (!config.whatsappEnabled)
        return { enabled: false, missing: [] };
    const required = [
        ['WHATSAPP_GRAPH_API_VERSION', config.whatsapp.graphApiVersion],
        ['WHATSAPP_PHONE_NUMBER_ID', config.whatsapp.phoneNumberId],
        ['WHATSAPP_ACCESS_TOKEN', config.whatsapp.accessToken],
        ['WHATSAPP_VERIFY_TOKEN', config.whatsapp.verifyToken],
        ['WHATSAPP_APP_SECRET', config.whatsapp.appSecret],
    ];
    return { enabled: true, missing: required.filter(([, value]) => !value).map(([key]) => key) };
}

# Índice de arquitectura

## Configuración por empresa
- Interfaz: `app/configuracion/ConfiguracionPage.tsx`
- Contexto: `src/tenant/TenantContext.tsx`
- API: `server/routes/companies.ts`
- Normalización: `server/homologation-config.ts`
- Migración: `server/db/migrations/006_homologation_parameters.sql`

## Autenticación
- Inicio de sesión: `app/login/LoginPage.tsx`
- Contexto y sesión: `src/auth/AuthContext.tsx`
- API: `server/routes/auth.ts`
- Marca del login: `public/logo-login.svg`; fondo: `public/images/login-homologacion-bg.png`

## Proveedores y expediente
- Interfaz: `app/proveedores/ProveedoresPage.tsx`, `components/proveedores/ProviderWorkbench.tsx`
- Tabla: `components/proveedores/ProveedoresTable.tsx`
- API: `server/routes/providers.ts`
- Persistencia de expediente: `server/provider-records.ts`

## Estatus de proveedores
- Interfaz: `components/homologaciones/ProviderStatusTable.tsx`
- Columnas y Excel: `services/statusTable.ts`
- API: `server/routes/reports.ts`

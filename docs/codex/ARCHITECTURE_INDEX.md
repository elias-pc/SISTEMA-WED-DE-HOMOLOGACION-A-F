# Índice de arquitectura

## Configuración por empresa
- Interfaz: `app/configuracion/ConfiguracionPage.tsx`
- Asociación de ejecutivas: `app/configuracion/ExecutiveCompanyAccess.tsx`
- Contexto: `src/tenant/TenantContext.tsx`
- API empresas: `server/routes/companies.ts`
- API usuarios/asociaciones: `server/routes/users.ts`
- Normalización: `server/homologation-config.ts`
- Migración: `server/db/migrations/006_homologation_parameters.sql`

## Carteras de ejecutivas
- Interfaz de asignaciones: `app/carteras/CarterasPage.tsx`
- API: `server/routes/assignments.ts`
- Relación ejecutiva-empresa: tabla `user_companies`
- Pruebas de asociación local: `server/users.e2e.test.ts`

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

## Reportes operativos
- Interfaz: `app/reportes/ReportesPage.tsx`
- Columnas y consultas por tipo: `server/operational-reports.ts`
- Exportación Excel institucional (logo, colores y días vencidos): `server/report-workbook.ts`
- API: `server/routes/reports.ts` (`preview`, `preview/users`, `export`)
- Logo de reportes: `public/logo-reportes.png`
- Modo demo en memoria: `server/dev-memory.ts`

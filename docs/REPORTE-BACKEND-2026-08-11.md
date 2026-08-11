# Reporte de implementación backend

Fecha: 11 de agosto de 2026

## Resultado

El proyecto pasó de ser una aplicación exclusivamente frontend con datos en `localStorage` a una arquitectura full-stack. El frontend conserva sus pantallas y ahora consume una API autenticada. El backend persiste empresas, procesos, proveedores, usuarios y sesiones en PostgreSQL.

## Arquitectura implementada

- Servidor Node.js con Express y TypeScript en `server/`.
- PostgreSQL mediante `pg` y `DATABASE_URL`.
- Migraciones SQL incrementales en `server/db/migrations/`.
- Seed idempotente con empresas, procesos y cuentas de demostración.
- Docker Compose con PostgreSQL 17 para desarrollo local.
- Proxy de Vite `/api` hacia el servidor local.
- Cliente HTTP centralizado en `services/api.ts`.
- Contextos React conectados a la API en lugar de `localStorage`.

## Modelo y seguridad

Las tablas `companies`, `users`, `user_companies`, `homologation_processes`, `providers`, `sessions` y `schema_migrations` incluyen claves foráneas, restricciones, valores enumerados e índices.

- Contraseñas con bcrypt, costo 12.
- Tokens de sesión aleatorios de 256 bits almacenados como hash SHA-256.
- Cookies `HttpOnly`, `SameSite=Strict` y `Secure` en producción.
- Helmet, CORS restringido, comprobación de origen y límite de intentos de login.
- Validación Zod y consultas SQL parametrizadas.
- RBAC y alcance por empresa comprobados nuevamente en el backend.

## Permisos

- Cliente: consulta de sus empresas, procesos y proveedores.
- Ejecutiva: registro y estados de contacto/formulario dentro de su alcance.
- Supervisor de empresa: estados de coordinación/visita dentro de sus empresas.
- Supervisor general: acceso global y administración de empresas, procesos y usuarios.

## APIs

- Autenticación: login, sesión y logout.
- Empresas: listado y creación.
- Procesos: listado y creación.
- Proveedores: listado por proceso, registro y cambio de estado.
- Usuarios: creación administrativa y asignación de empresas.
- Salud: `/api/health`.

## Validación

- Pruebas automatizadas: 4 aprobadas.
- TypeScript frontend y backend: aprobado.
- Build Vite y Node.js: aprobado.
- `git diff --check`: aprobado.

## Riesgos y siguientes pasos

- Docker Desktop no inició su motor durante la sesión, por lo que no se ejecutó una prueba contra PostgreSQL real. Compose, migrador y seed quedaron listos.
- La auditoría remota de npm no pudo consultar el registro por restricción de red. Debe repetirse con conexión.
- Para producción se requiere PostgreSQL administrado, secretos del hosting y TLS.
- Deben reemplazarse las contraseñas de demostración antes de cargar datos reales.
- Se recomiendan pruebas de integración con PostgreSQL temporal en CI.

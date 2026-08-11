# A&F Homologación

Sistema full-stack para administrar empresas, procesos y proveedores con permisos por rol.

## Tecnologías

- Frontend: React, Vite y TypeScript.
- Backend: Node.js, Express y TypeScript.
- Base de datos: PostgreSQL 17.
- Seguridad: bcrypt, sesiones opacas en cookies HttpOnly, Helmet, CORS, validación Zod y RBAC.

## Inicio local

1. Copiar `.env.example` como `.env`.
2. Iniciar Docker Desktop.
3. Ejecutar `docker compose up -d postgres`.
4. Ejecutar `npm run db:setup`.
5. Ejecutar `npm run dev`.
6. Abrir `http://127.0.0.1:4173`.

La API queda disponible en `http://127.0.0.1:3001/api`.

## Comandos

- `npm run dev`: inicia API y frontend.
- `npm run db:migrate`: aplica migraciones pendientes.
- `npm run db:seed`: crea las cuentas y datos iniciales.
- `npm test`: ejecuta pruebas automatizadas.
- `npm run typecheck`: valida frontend y backend.
- `npm run build`: compila frontend y backend.

## Despliegue en Vercel

El proyecto está preparado para desplegar el frontend Vite y la API Express en el mismo proyecto de Vercel.

1. Crear o vincular una base PostgreSQL administrada (por ejemplo, Neon).
2. Configurar `DATABASE_URL` en los entornos Preview y Production de Vercel.
3. Definir temporalmente `SEED_DEMO_PASSWORD` y `SEED_SUPERVISOR_PASSWORD` con contraseñas seguras.
4. Aplicar `npm run db:migrate` y luego `npm run db:seed` usando la URL de la base desplegada.
5. Ejecutar `vercel deploy` para obtener una vista previa.
6. Comprobar `/api/health`; debe responder `{"status":"ok","storage":"postgresql"}`.
7. Cuando la vista previa esté validada, ejecutar `vercel deploy --prod`.

`APP_ORIGIN` es opcional en Vercel porque la aplicación reconoce automáticamente las URL del despliegue. Puede configurarse con el dominio definitivo para restringir explícitamente el origen permitido.

## API

- `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`.
- `GET|POST /api/companies`.
- `GET|POST /api/processes`.
- `GET|POST /api/providers` y `PATCH /api/providers/:id/status`.
- `POST /api/users` para administración del supervisor general.

Todas las rutas de negocio requieren una sesión válida. El servidor aplica permisos y alcance por empresa; ocultar elementos en el frontend no se considera una medida de seguridad.

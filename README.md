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
4. Ejecutar `npm run db:setup:local`. Este comando rechaza una URL de base de datos que no sea local.
5. Ejecutar `npm run dev`.
6. Abrir `http://127.0.0.1:4173`.

La API queda disponible en `http://127.0.0.1:3001/api`.

## Comandos

- `npm run dev`: inicia API y frontend.
- `npm run db:migrate`: aplica migraciones pendientes.
- `npm run db:seed`: crea las cuentas y datos iniciales.
- `npm run db:setup:local`: valida que `DATABASE_URL` apunte a `localhost`, aplica las migraciones y carga datos de prueba.
- `npm run test:local`: prepara la base local y ejecuta las pruebas automatizadas y de tipos.
- `npm test`: ejecuta pruebas automatizadas.
- `npm run typecheck`: valida frontend y backend.
- `npm run build`: compila frontend y backend.

## Despliegue en Vercel

El proyecto está preparado para desplegar el frontend Vite y la API Express en el mismo proyecto de Vercel.

1. Crear o vincular una base PostgreSQL administrada (por ejemplo, Neon).
2. Configurar una `DATABASE_URL` distinta para cada entorno: una base o rama de pruebas en Preview y otra exclusivamente para Production.
3. Definir temporalmente `SEED_DEMO_PASSWORD` y `SEED_SUPERVISOR_PASSWORD` con contraseñas seguras.
4. Aplicar `npm run db:migrate` y luego `npm run db:seed` usando la URL de la base desplegada.
5. Ejecutar `vercel deploy` para obtener una vista previa.
6. Comprobar `/api/health`; debe responder `{"status":"ok","storage":"postgresql"}`.
7. Cuando la vista previa esté validada, promoverla o desplegar explícitamente a producción.

`APP_ORIGIN` es opcional en Vercel porque la aplicación reconoce automáticamente las URL del despliegue. Puede configurarse con el dominio definitivo para restringir explícitamente el origen permitido.

## API

- `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`.
- `GET|POST /api/companies`.
- `GET|POST /api/processes`.
- `GET|POST /api/providers`.
- `GET /api/providers/:id/workflow` y `POST /api/providers/:id/transitions` para el flujo formal.
- `POST /api/users` para administración del supervisor general.

Todas las rutas de negocio requieren una sesión válida. El servidor aplica permisos y alcance por empresa; ocultar elementos en el frontend no se considera una medida de seguridad.

La especificación completa de los nueve pasos, estados y transiciones está en [`docs/FLUJO-FORMAL-HOMOLOGACION.md`](docs/FLUJO-FORMAL-HOMOLOGACION.md).

El circuito local y de Preview, incluyendo la lista de comprobación del flujo, está en [`docs/PRUEBAS-LOCALES-Y-PREVIEW.md`](docs/PRUEBAS-LOCALES-Y-PREVIEW.md).

# A&F Homologación

Sistema full-stack para administrar empresas, procesos y proveedores con permisos por rol.

## Tecnologías

- Frontend: React, Vite y TypeScript.
- Backend: Node.js, Express y TypeScript.
- Base de datos: PostgreSQL 17.
- Seguridad: bcrypt, sesiones opacas en cookies HttpOnly, Helmet, CORS, validación Zod y RBAC.

## Inicio local

### Modo demostración, sin PostgreSQL

1. Ejecutar `pnpm install` (o `npm install` en un equipo con npm instalado).
2. Crear `.env.local` a partir de `.env.example`, **sin** `DATABASE_URL`.
3. Ejecutar `pnpm run dev`.
4. Abrir `http://127.0.0.1:4173`.

El modo demostración mantiene los datos en memoria y permite probar login, flujo, expedientes, importación, reportes y cron sin depender de una base remota.

### Modo PostgreSQL local

1. Instalar e iniciar Docker Desktop.
2. Configurar `DATABASE_URL=postgresql://af_user:af_password@127.0.0.1:5432/af_homologacion` en `.env.local`.
3. Ejecutar `docker compose up -d postgres`.
4. Ejecutar `pnpm run db:setup:local`. Este comando rechaza una URL de base de datos que no sea local.
5. Ejecutar `pnpm run dev`.

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
- `GET /api/providers/:id/dossier`, documentos, preferencias de contacto e importación Excel para el expediente operativo.
- `GET /api/reports/dashboard` y `GET /api/reports/operational` para indicadores y exportaciones.
- `GET /api/assignments/portfolio` y `POST /api/assignments/{assign,distribute,unassign}` para administrar carteras con historial.
- `GET /api/reports/productivity` para productividad histórica por ejecutiva y período.
- `GET /api/cron/certificates`, protegido con `CRON_SECRET`, para vigencias automáticas.
- `POST /api/users` para administración del supervisor general.

Todas las rutas de negocio requieren una sesión válida. El servidor aplica permisos y alcance por empresa; ocultar elementos en el frontend no se considera una medida de seguridad.

La especificación completa de los nueve pasos, estados y transiciones está en [`docs/FLUJO-FORMAL-HOMOLOGACION.md`](docs/FLUJO-FORMAL-HOMOLOGACION.md).

El circuito local y de Preview, incluyendo la lista de comprobación del flujo, está en [`docs/PRUEBAS-LOCALES-Y-PREVIEW.md`](docs/PRUEBAS-LOCALES-Y-PREVIEW.md).

## Excel, documentos y WhatsApp

- La importación acepta una primera hoja Excel con RUC, razón social, contacto, teléfono, correo, dirección, departamento, distrito y actividad principal. Las columnas adicionales se conservan como filtros del proveedor.
- Los documentos se guardan en `data/uploads` solamente durante el desarrollo local; esa carpeta está ignorada por Git. Para producción se debe configurar un almacenamiento administrado antes de desplegar.
- WhatsApp está preparado mediante preferencias de consentimiento, cola de notificaciones y eventos del flujo, pero se mantiene desactivado. No se envían mensajes ni se llama a Meta mientras `NOTIFICATIONS_PROVIDER=disabled` y `WHATSAPP_ENABLED=false`.

## Preparación para Neon

El código sigue usando PostgreSQL estándar y queda listo para conectar una base Neon cuando exista la cuenta:

- `DATABASE_URL`: conexión agrupada (pooled) usada por la API.
- `DATABASE_URL_UNPOOLED`: conexión directa usada por `npm run db:migrate`.
- `DATABASE_SSL=true`: habilita TLS para ambas conexiones.

Mientras `DATABASE_URL` permanezca vacía en desarrollo, la aplicación usa exclusivamente la memoria local. La creación del proyecto Neon, sus credenciales y la migración de datos quedan pendientes y no forman parte de las pruebas locales actuales.

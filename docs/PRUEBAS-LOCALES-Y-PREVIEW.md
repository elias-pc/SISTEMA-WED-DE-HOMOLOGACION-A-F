# Circuito seguro de pruebas

## 1. Prueba local: sin Git ni Vercel

1. Copia `.env.example` como `.env` y define contraseñas de prueba para `SEED_DEMO_PASSWORD` y `SEED_SUPERVISOR_PASSWORD`.
2. Inicia Docker Desktop y ejecuta `docker compose up -d postgres`.
3. Ejecuta `npm run test:local`.
4. Ejecuta `npm run dev` y abre `http://127.0.0.1:4173`.
5. Comprueba `http://127.0.0.1:3001/api/health`. Debe responder `storage: "postgresql"`.

`db:setup:local` valida que la base esté en `localhost`, `127.0.0.1` o `::1`. Si se indica una URL de Neon, Vercel u otra base remota, se detiene antes de aplicar una migración.

## Cuentas de prueba

Las contraseñas son las definidas en `.env`:

- `administradora@af.com`: creación de proveedores y asignación de ejecutiva.
- `ejecutiva@decal.com`: inscripción, pago, formulario y entregables.
- `jefe.inspecciones@decal.com`: asignación o reasignación de inspector.
- `inspector@decal.com`: coordinación, visita y conformidad.

## Recorrido mínimo del flujo

1. Como administradora, crea un proveedor en `DECAL-2026-001` y asigna `ejecutiva@decal.com`.
2. Como ejecutiva, inicia la coordinación, registra el pago, envía el formulario y registra su devolución.
3. Como jefe de inspecciones, asigna `inspector@decal.com`.
4. Como inspector, programa y registra la visita; después confirma la conformidad.
5. Como ejecutiva, emite el entregable con fecha de vencimiento.
6. Comprueba el historial del proveedor, que el estado final sea `HOMOLOGADO / VIGENTE` y que una modificación con la versión anterior reciba conflicto `409`.

## 2. Preview: separado de producción

1. Confirma que las pruebas locales terminaron correctamente.
2. Haz commit y push solo de `desarrollo_local`; no hagas merge a `main`.
3. En Vercel, configura `DATABASE_URL` del entorno **Preview** con una rama o base de datos de pruebas independiente.
4. Aplica `npm run db:migrate` y `npm run db:seed` usando exclusivamente esa URL de Preview.
5. Prueba la URL de Preview generada por Vercel y valida el mismo recorrido.

No uses `vercel --prod`, no promociones el Preview y no ejecutes migraciones con la URL de Production durante esta etapa. La URL pública y los datos de producción no cambiarán.

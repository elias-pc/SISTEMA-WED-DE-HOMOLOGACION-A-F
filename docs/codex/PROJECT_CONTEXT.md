# Sistema de Homologación A&F

Aplicación multiempresa para gestionar proveedores, flujos de homologación, expedientes, asignaciones y reportes.

- Frontend: React, Vite y TypeScript.
- Backend: Node.js, Express y TypeScript.
- Datos: PostgreSQL; el modo local sin `DATABASE_URL` usa memoria temporal.
- Ejecución: `pnpm dev`; validación: `pnpm test`, `pnpm run typecheck`, `pnpm run build`.
- La configuración por empresa define filtros, documentos, vigencias, dictámenes y módulos de evaluación.

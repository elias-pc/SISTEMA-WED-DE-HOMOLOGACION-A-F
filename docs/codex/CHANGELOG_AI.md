# Cambios realizados por Codex

## 2026-11-06

### Tarea
Completar los reportes operativos con columnas acordadas, identidad institucional y filtros.

### Archivos principales
- `server/operational-reports.ts`
- `server/report-workbook.ts`
- `server/routes/reports.ts`
- `app/reportes/ReportesPage.tsx`
- `server/dev-memory.ts`
- `src/styles/global.css`
- `docs/codex/ARCHITECTURE_INDEX.md`

### Resultado
Los cinco reportes (directorio, facturación, homologados, inspecciones y trazabilidad) usan las etiquetas solicitadas. La exportación Excel incluye el logo A&F y la paleta institucional, siempre con todas las columnas del reporte, y muestra en rojo los días por vencer negativos. La vista previa permite buscar y filtrar por cliente y usuario, y la búsqueda se aplica también al Excel exportado; el botón de descarga está dentro de esa vista previa. El modo demo en memoria incorpora los endpoints `preview`, `preview/users` y `export` para que los reportes funcionen sin PostgreSQL.

### Consideraciones
Se corrigieron los errores de TypeScript del buffer del logo y del estado HTTP del reporte. Validado con typecheck, build, 40 pruebas, descarga real de Excel y revisión de la pantalla en el navegador. Sin commit, push ni despliegue.

## 2026-11-06

### Tarea
Aplicar observaciones del cliente sobre status, cartera y parámetros por empresa.

### Archivos principales
- `components/layout/MainLayout.tsx`
- `app/homologaciones/HomologacionesPage.tsx`
- `components/homologaciones/ProviderStatusTable.tsx`
- `app/carteras/CarterasPage.tsx`
- `app/mi-cartera/MiCarteraPage.tsx`
- `app/configuracion/ConfiguracionPage.tsx`
- `services/statusTable.ts`
- `src/styles/global.css`

### Resultado
La terminología visible usa “Status” en lugar de “Estatus”. La tabla de status toma la identidad institucional (azul marino, acento rojo y texto blanco) y ya no muestra Filtro 2. Cartera de ejecutivas eliminó la columna Paso, y Mi Cartera reemplazó Avance/Situación por Status/Sub Status sin referencias al paso.

### Consideraciones
Los datos históricos de `filtro2` se conservan; solo se dejó de solicitar y mostrar. Validado con typecheck, build, 40 pruebas y revisión en navegador. Sin commit, push ni despliegue.

## 2026-10-21

### Tarea
Administrar la asociación de ejecutivas con empresas para habilitar asignaciones multempresa.

### Archivos principales
- `app/configuracion/ExecutiveCompanyAccess.tsx`
- `server/routes/users.ts`
- `server/dev-memory.ts`
- `services/api.ts`
- `server/users.e2e.test.ts`

### Resultado
Se añadió una interfaz para que administradora/supervisora general vincule ejecutivas activas con una o más empresas. La API persiste el conjunto de vínculos y bloquea retirar empresas con proveedores activos asignados. El modo de memoria local implementa el mismo comportamiento.

### Consideraciones
Se reutiliza la tabla existente `user_companies`; no requiere migración. Los vínculos existentes se conservan. Cambios locales únicamente; sin commit, push ni despliegue.

## 2026-09-30

### Tarea
Rediseño local de inicio de sesión con fondo fotográfico y monograma A&F.

### Archivos principales
- `app/login/LoginPage.tsx`
- `src/styles/global.css`
- `public/logo-login.svg`
- `public/images/login-homologacion-bg.png`

### Resultado
El formulario aparece a la derecha sobre una tarjeta clara, con fotografía de equipo y degradado rojo en el fondo. Se incorporó el monograma continuo A&F elegido y ajustes responsive para pantallas pequeñas.

### Consideraciones
Validado visualmente en el servidor local; typecheck, build y 39 pruebas pasaron. El cambio es de interfaz y no requiere migración de base de datos.

## 2026-09-30

### Tarea
Actualización local de la cabecera principal con la opción visual 2.

### Archivos principales
- `components/layout/MainLayout.tsx`
- `src/styles/global.css`

### Resultado
La cabecera usa una paleta azul marino con acento rojo, incorpora un chip central “Panel” y agrupa la identidad del usuario con avatar y rol. Se adaptó el diseño para tablet y móvil.

### Consideraciones
Al cierre del 2026-09-30 el cambio seguía local; después se publicó en Vercel mediante el commit `7e1d2b6` del 2026-10-01.

## 2026-10-01

### Tarea
Rediseño local del resumen y gráfico de estatus del dashboard (propuesta 2).

### Archivos principales
- `app/dashboard/DashboardPage.tsx`
- `components/dashboard/StatusSummaryTable.tsx`
- `components/dashboard/PieChart.tsx`
- `src/styles/global.css`

### Resultado
El gráfico se muestra a la izquierda como dona con el total al centro; el resumen va a la derecha, con cabecera roja y grupos de estatus principales, otros estatus y certificados. En pantallas pequeñas los bloques se apilan.

### Consideraciones
Validado localmente y aprobado para publicarse en la rama de producción.

### Ajuste posterior
Se amplió el gráfico, se compactó y alineó a la derecha el selector de empresa/proceso en el dashboard, y se retiraron el título, subtítulo y las cinco tarjetas de métricas redundantes.

### Ajuste de tamaño
El panel del gráfico se amplió a aproximadamente el 56% de la fila, con dona de 380 px y altura mínima compartida de 450 px para el resumen en escritorio. Se agregaron tamaños adaptables para tablet y móvil.

Durante la comprobación visual se corrigió también el caso de un único estatus con proveedores: ahora el gráfico dibuja el círculo completo en lugar de quedar vacío.

### Selector de empresa y proceso
El selector compacto con tema azul marino se aplica desde `MainLayout` a todas las pestañas y roles autenticados. Las opciones siguen limitadas por las empresas/procesos accesibles para el usuario según las APIs existentes.

### Publicación
El commit `2edd301` se publicó en la rama `desplegar` y se promovió a producción en Vercel. El despliegue quedó `READY`; la URL de producción y `/api/health` respondieron `200`, con almacenamiento PostgreSQL.

## 2026-09-29

### Tarea
Ocultar la columna Acción a clientes y supervisores de empresa.

### Archivos principales
- `app/proveedores/ProveedoresPage.tsx`
- `components/proveedores/ProveedoresTable.tsx`

### Resultado
La tabla ya no muestra la columna ni permite abrir el expediente operativo para esos roles; el resto conserva el acceso según sus permisos.

### Consideraciones
Validado con pruebas, typecheck y build. El cambio permanece local.

## 2026-09-29

### Tarea
Ajuste de columnas en Información de proveedores según Plantilla 2.

### Archivos modificados
- `components/proveedores/ProveedoresTable.tsx`
- `app/proveedores/ProveedoresPage.tsx`

### Cambio realizado
La tabla ahora incluye numeración, dirección, departamento y los filtros de la empresa; quita Distrito y Estado formal de esta vista. Se conserva Abrir expediente.

### Consideraciones
La verificación de tipos pasó. No se creó commit ni se publicó el cambio.

## 2026-09-29

### Tarea
Implementación local de los nuevos parámetros del Excel actualizado.

### Archivos principales
- `app/configuracion/ConfiguracionPage.tsx`, `src/tenant/TenantContext.tsx` y `types/index.ts`
- `server/homologation-config.ts`, `server/routes/companies.ts`, `server/routes/providers.ts` y `server/db/migrations/006_homologation_parameters.sql`
- `app/proveedores/ProveedoresPage.tsx`, `components/proveedores/ProveedoresTable.tsx` y `components/proveedores/ProviderWorkbench.tsx`
- `components/homologaciones/ProviderStatusTable.tsx` y `services/statusTable.ts`

### Resultado
Se agregó configuración individual por empresa con hasta dos filtros, tipos documentales y vigencias, dictámenes y módulos de evaluación. Los parámetros se validan y normalizan en el backend; se guardan en `companies.homologation_config` y están disponibles también en el modo local en memoria.

Los filtros configurados se capturan al registrar proveedores, se reconocen al importar Excel y se devuelven en la tabla de proveedores. El expediente usa los tipos de documento y dictámenes de la empresa, calcula la fecha de vencimiento desde fecha de emisión y vigencia, y permite registrar puntajes por módulo. El reporte de estatus y su exportación Excel incorporan los filtros configurados y los módulos.

La columna Acción y la apertura del expediente operativo se ocultan para los roles Cliente y Supervisor de empresa. Se añadieron pruebas para la normalización de parámetros, el cálculo de vencimientos y las columnas/exportación del reporte.

### Consideraciones
La migración `006_homologation_parameters.sql` se aplicó a Neon producción y el commit `de96c6c` quedó desplegado en Vercel el 2026-09-30. Los ajustes visuales posteriores son locales.

## 2026-11-05

### Tarea
Correcciones visuales y de consistencia del dashboard según observaciones.

### Archivos principales
- `app/dashboard/DashboardPage.tsx`
- `components/dashboard/StatusSummaryTable.tsx`
- `src/styles/global.css`

### Resultado
La dona ahora muestra los mismos cinco status del resumen principal. Los tres cuadros se presentan verticalmente, los encabezados se muestran en mayúsculas con la misma paleta azul institucional y la fila Total ya no numera como `0`.

### Consideraciones
Validado con typecheck, build y comprobación visual en el entorno local. El cambio es solo de interfaz y permanece sin commit ni despliegue.

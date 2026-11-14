# Cambios realizados por Codex

## 2026-11-06

### Tarea
Mantener la ventana flotante de Status dentro de la pantalla, sobre todo al registrar el pago.

### Archivos principales
- `components/homologaciones/StatusChangePopover.tsx`
- `src/styles/global.css`

### Resultado
La ventana mide su altura real y se posiciona dentro del área visible; su alto máximo es `min(560px, calc(100vh - 1rem))` con desplazamiento interno. Al elegir un sub-status se oculta el catálogo y se muestra solo el formulario, con los botones “Volver” y “Confirmar cambio” fijos al pie. Ya no queda cortada por la barra de tareas y el pago se puede completar en ventanas bajas.

### Consideraciones
Validado en navegador con 479×481 px: la ventana queda en 8–473 px de alto, el formulario de “Registrar pago” desplaza internamente y no se superpone con los botones. Typecheck de los tres proyectos, build web y 44 pruebas correctos. Sin commit, push ni despliegue.

## 2026-11-06

### Tarea
Corregir filas recortadas en Status de proveedores y habilitar el cambio de status para la administración.

### Archivos principales
- `src/styles/global.css`
- `server/workflow.ts`
- `components/homologaciones/StatusChangePopover.tsx`
- `components/homologaciones/ProviderStatusTable.tsx`
- `server/workflow.test.ts`

### Resultado
La tabla muestra todas las filas del proceso (ya no hay scroll interno recortando a 4 visibles) con filas compactas y la columna Módulos con ancho propio. El encabezado indica cuántos proveedores hay en el proceso. `administradora` y `supervisor_general` reciben las transiciones operativas de ejecutiva, jefe de inspecciones e inspector sin saltarse el flujo, y las automáticas (Por vencer/Vencido) siguen reservadas al sistema. Si un rol no tiene cambios en la etapa actual, la ventana flotante lo explica.

### Consideraciones
La diferencia entre 4 y 10 filas era visual (altura fija de 560 px con filas de 160–240 px a poco ancho), no un filtro por rol. Validado con typecheck, build, 44 pruebas y navegador como administradora (12 filas, transición “Registrar visita realizada” aplicada) y como ejecutiva (10 filas). Sin commit, push ni despliegue.

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

## 2026-11-06

### Tarea
Cambio de Status y Sub-Status desde la tabla de seguimiento, mediante ventana flotante.

### Archivos principales
- `server/workflow.ts`
- `server/routes/providers.ts`
- `server/dev-memory.ts`
- `server/my-portfolio.ts`
- `components/homologaciones/ProviderStatusTable.tsx`
- `components/homologaciones/StatusChangePopover.tsx`
- `src/styles/global.css`
- `types/index.ts`, `services/api.ts`

### Resultado
Las celdas Status y Sub-Status abren una ventana flotante con el catálogo del proceso operativo (Pendiente de inscripción, Inscrito, Homologado). Cada opción se habilita según las transiciones disponibles del rol; las opciones automáticas del sistema se marcan y las que exigen datos abren un formulario antes de confirmar. Se agregó el Sub-Status “Confirmaron participación” y su transición, y `GET /providers/:id/workflow` devuelve el catálogo.

### Consideraciones
Cliente y Supervisor de empresa mantienen la tabla en solo lectura, y el backend sigue validando rol, estado y campos obligatorios. Validado con typecheck web/servidor, build y 43 pruebas; verificado en navegador con ejecutiva y cliente. Sin commit, push ni despliegue.

## 2026-11-06

### Tarea
Datos de ejemplo completos en el modo demo en memoria.

### Archivos principales
- `server/dev-memory.ts`
- `server/reports.e2e.test.ts`, `server/my-portfolio.e2e.test.ts`

### Resultado
DECAL pasa de 2 a 12 proveedores con contacto, dirección y Rubro. Cada uno tiene expediente: asignación de ejecutiva, pagos, formularios, inspecciones, certificados (Certificado/Constancia con dictamen, puntaje, módulos y vigencia), historial del flujo hasta su estado actual y documentos PDF generados localmente y descargables. Los filtros de empresa quedan en “Rubro” y los cinco reportes operativos y el dashboard muestran datos reales.

### Consideraciones
El dashboard del modo demo calcula por vencer/vencidos con la fecha actual en lugar de fechas fijas, y “Tipo de Documento” ya no toma la categoría del expediente. Las pruebas e2e se ajustaron a los nuevos volúmenes (10 proveedores visibles para `ejecutiva@decal.com`). Validado con typecheck, build, 43 pruebas y navegador. Sin commit, push ni despliegue.

## 2026-11-07

### Tarea
Filtros por columna en Información de proveedores.

### Archivos principales
- components/proveedores/ProveedoresTable.tsx

### Resultado
Fila de filtros bajo los encabezados; se combinan con la búsqueda general de la página. Validado con typecheck y 44 pruebas.

### Consideraciones
El filtrado es en cliente; si la lista crece se deberá mover a filtros/paginación en backend.

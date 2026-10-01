# Cambios realizados por Codex

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

# Estado actual

- Configuración de parámetros por empresa implementada localmente.
- Los nuevos proveedores e importaciones guardan los dos filtros configurables.
- El expediente usa documentos, dictámenes y módulos configurados; la fecha de vencimiento se calcula desde la vigencia del documento.
- La tabla de estatus permite visualizar/exportar Filtro 1, Filtro 2 y Módulos.
- La pantalla Información de proveedores muestra Nro, RUC, Razón Social, Contacto, Teléfonos, E-Mail, Dirección, Departamento y filtros configurados; oculta Acción y el expediente operativo para Cliente y Supervisor de empresa.
- La migración `006_homologation_parameters.sql` está pendiente de aplicarse a una base de datos; no se ejecutó en Neon ni en producción.
- Los cambios locales están validados; el commit/push/despliegue debe reflejarse aquí cuando ocurra.

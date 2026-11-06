# Estado actual

- Configuración de parámetros por empresa implementada localmente.
- Los nuevos proveedores e importaciones guardan los dos filtros configurables.
- El expediente usa documentos, dictámenes y módulos configurados; la fecha de vencimiento se calcula desde la vigencia del documento.
- La tabla de estatus permite visualizar/exportar Filtro 1, Filtro 2 y Módulos.
- La pantalla Información de proveedores muestra Nro, RUC, Razón Social, Contacto, Teléfonos, E-Mail, Dirección, Departamento y filtros configurados; oculta Acción y el expediente operativo para Cliente y Supervisor de empresa.
- La migración `006_homologation_parameters.sql` está aplicada en Neon producción; el commit `de96c6c` fue desplegado en Vercel.
- El login usa un fondo fotográfico, tarjeta a la derecha y monograma A&F; el cambio fue validado localmente con typecheck, build, pruebas y vista del navegador.
- La cabecera principal usa la opción visual 2 (azul marino, acento rojo, chip “Panel” e identidad de usuario agrupada); publicada con el commit `7e1d2b6`.
- El dashboard tiene la propuesta visual 2 para estatus en producción: gráfico grande a la izquierda (dona 380 px; panel ~56% de la fila), resumen agrupado alto a la derecha y selector compacto de empresa/proceso compartido en todas las pestañas y roles. El commit `2edd301` está `READY` en Vercel y `/api/health` confirma almacenamiento PostgreSQL.
- Local: se agregó administración de las empresas asociadas a cada ejecutiva desde “Empresas y procesos”. La asociación es explícita y sigue controlando qué ejecutivas aparecen en Carteras; se bloquea retirar una empresa si hay proveedores activos asignados. No se ha hecho commit, push ni despliegue.
- Local: el dashboard ahora alinea la dona con los cinco status del resumen, apila los tres cuadros de resumen y unifica sus encabezados y la fila Total con la identidad azul institucional. No se ha hecho commit, push ni despliegue.
- Local: los cinco reportes operativos usan las columnas solicitadas, incluyen logo y colores institucionales en el Excel, permiten buscar y filtrar por cliente/usuario, y exportar siempre con todas las columnas del reporte; resaltan en rojo los días por vencer negativos. El modo demo en memoria ya expone `preview`, `preview/users` y `export`, y la búsqueda también se aplica al Excel exportado. Validado con typecheck, build y 40 pruebas.

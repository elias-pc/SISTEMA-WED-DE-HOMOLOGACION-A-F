# Estado actual

- Configuración de parámetros por empresa implementada localmente.
- Los nuevos proveedores e importaciones guardan los dos filtros configurables.
- El expediente usa documentos, dictámenes y módulos configurados; la fecha de vencimiento se calcula desde la vigencia del documento.
- La tabla de estatus permite visualizar/exportar Filtro 1, Filtro 2 y Módulos.
- La pantalla Información de proveedores muestra Nro, RUC, Razón Social, Contacto, Teléfonos, E-Mail, Dirección, Departamento y filtros configurados; oculta Acción y el expediente operativo para Cliente y Supervisor de empresa.
- La migración `006_homologation_parameters.sql` está aplicada en Neon producción; el commit `de96c6c` fue desplegado en Vercel.
- El login usa un fondo fotográfico, tarjeta a la derecha y monograma A&F; el cambio fue validado localmente con typecheck, build, pruebas y vista del navegador.
- La cabecera principal usa la opción visual 2 (azul marino, acento rojo, chip “Panel” e identidad de usuario agrupada); publicada con el commit `7e1d2b6`.
- El dashboard tiene localmente la propuesta visual 2 para estatus: gráfico grande a la izquierda (dona 380 px; panel ~56% de la fila), resumen agrupado alto a la derecha y selector compacto de empresa/proceso. El selector se comparte ahora en todas las pestañas y roles, limitado a las empresas y procesos devueltos al usuario por la API. No se ha publicado.

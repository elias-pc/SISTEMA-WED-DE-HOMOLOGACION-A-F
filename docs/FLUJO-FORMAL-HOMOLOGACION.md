# Flujo formal de homologación

Este documento define el flujo de negocio que debe respetar la API. El estado no se modifica libremente: todo cambio se ejecuta mediante una transición autorizada, se valida contra el paso actual y se registra en `provider_status_history`.

## Pasos y responsables

| Paso | Código | Responsable | Resultado esperado |
|---:|---|---|---|
| 1 | `CREACION_CLIENTE` | Administradora | Cliente y acceso creados |
| 2 | `REGISTRO_PROVEEDOR` | Administradora | Proveedor registrado |
| 3 | `ASIGNACION_EJECUTIVA` | Administradora | Ejecutiva asignada |
| 4 | `INVITACION_INSCRIPCION` | Ejecutiva | Participación coordinada o resultado de contacto registrado |
| 5 | `FORMULARIO` | Ejecutiva | Pago y formulario gestionados |
| 6 | `ASIGNACION_INSPECTOR` | Jefe de inspecciones | Inspector asignado |
| 7 | `INSPECCION` | Inspector | Visita y conformidad registradas |
| 8 | `ENTREGABLES` | Ejecutiva | Entregable emitido |
| 9 | `HOMOLOGACION` | Ejecutiva / Sistema | Vigencia y observaciones administradas |

## Estados principales

- `PENDIENTE_INSCRIPCION`: desde el registro hasta la confirmación del pago.
- `INSCRITO`: desde el pago confirmado hasta la emisión de los entregables.
- `HOMOLOGADO`: certificado o constancia emitidos, con control de vigencia.

Los subestados detallan la posición exacta y determinan qué transiciones pueden ejecutarse.

## Transiciones

| Transición | Rol | Cambio principal |
|---|---|---|
| `ASIGNAR_EJECUTIVA` | Administradora | Registrado → asignado a ejecutiva |
| `INICIAR_COORDINACION` | Ejecutiva | Asignado/retomado → en coordinación |
| `MARCAR_DATOS_INCOMPLETOS` | Ejecutiva | Registra datos incompletos |
| `MARCAR_NO_ES_PROVEEDOR` | Ejecutiva | Registra que no corresponde a un proveedor |
| `MARCAR_NO_UBICADO` | Ejecutiva | Registra que no fue ubicado |
| `MARCAR_NO_RESPONDE` | Ejecutiva | Registra que no responde |
| `DESESTIMAR_INSCRIPCION` | Ejecutiva | Desestima la inscripción |
| `MARCAR_NO_PARTICIPA` | Ejecutiva | Registra que no participa |
| `REGISTRAR_CERTIFICADO_EXISTENTE` | Ejecutiva | Pasa directamente a homologado vigente |
| `REGISTRAR_PAGO` | Ejecutiva | Pendiente → inscrito; exige datos del pago |
| `ENVIAR_FORMULARIO` | Ejecutiva | Pago confirmado → formulario enviado |
| `RECIBIR_FORMULARIO` | Ejecutiva | Formulario enviado → formulario devuelto |
| `ASIGNAR_INSPECTOR` | Jefe de inspecciones | Formulario devuelto → inspector asignado |
| `PROGRAMAR_VISITA` | Inspector | Inspector asignado → visita en coordinación |
| `REPROGRAMAR_VISITA` | Inspector | Visita en coordinación → reprogramada |
| `MARCAR_NO_UBICADO_VISITA` | Inspector | Registra que no fue ubicado para la visita |
| `DESESTIMAR_VISITA` | Inspector | Desestima la visita |
| `RETOMAR_VISITA` | Jefe de inspecciones | Reactiva y reasigna una visita desestimada |
| `REGISTRAR_VISITA` | Inspector | Registra la visita realizada |
| `CONFIRMAR_CONFORMIDAD` | Inspector | Visita realizada → pendiente de entregables |
| `EMITIR_ENTREGABLE` | Ejecutiva | Inscrito → homologado vigente |
| `INICIAR_OBSERVACIONES` | Ejecutiva | Inicia levantamiento de observaciones |
| `CERRAR_OBSERVACIONES` | Ejecutiva | Cierra observaciones y recupera vigencia |
| `MARCAR_POR_VENCER` | Sistema | Vigente → por vencer |
| `MARCAR_VENCIDO` | Sistema | Vigente/por vencer → vencido |

## API

- `GET /api/providers/:id/workflow`: devuelve estado actual, transiciones disponibles para el usuario e historial.
- `POST /api/providers/:id/transitions`: aplica una transición con `transicion`, `datos`, `motivo` y la `version` conocida.
- `PATCH /api/providers/:id/status`: retirado; responde `410` para impedir cambios que evadan el flujo.

La versión del flujo implementa control de concurrencia optimista. Si otro usuario modificó el proveedor, la API responde `409` y exige recargar antes de continuar.

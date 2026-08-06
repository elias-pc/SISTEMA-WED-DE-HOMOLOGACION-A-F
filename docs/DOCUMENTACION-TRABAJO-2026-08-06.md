# Sistema web de homologación A&F

## Informe de trabajo — 6 de agosto de 2026

### Objetivo

Construir un prototipo funcional para administrar procesos de homologación de proveedores de varias empresas cliente, manteniendo separada la información de cada organización.

### Funcionalidades implementadas

#### Autenticación y roles

- Inicio de sesión con correo y contraseña.
- Sesión persistente durante la pestaña activa.
- Cierre de sesión.
- Rutas protegidas y pantalla de acceso restringido.
- Cuatro roles: cliente, ejecutiva, supervisor de empresa y supervisor general.
- El menú se adapta a los permisos del usuario.

#### Permisos

| Función | Cliente | Ejecutiva | Supervisor empresa | Supervisor general |
|---|---:|---:|---:|---:|
| Consultar dashboard | Sí | Sí | Sí | Sí |
| Consultar proveedores | Sí | Sí | Sí | Sí |
| Registrar proveedores | No | Sí | Sí | Sí |
| Cambiar estado de proveedor | No | Sí | Sí | Sí |
| Consultar homologaciones | Sí | Sí | Sí | Sí |
| Descargar reportes | Sí | Sí | Sí | Sí |
| Crear empresas y procesos | No | No | No | Sí |
| Consultar todas las empresas | No | Solo asignadas | No | Sí |

#### Modelo multiempresa

- Cada usuario cliente pertenece a una empresa mediante `empresaIds`.
- Cada proceso pertenece a una empresa mediante `empresaId`.
- Cada proveedor pertenece a una empresa y proceso mediante `empresaId` y `procesoId`.
- Las pantallas filtran automáticamente los datos usando la empresa y el proceso activos.
- El cliente entra directamente en el espacio de su empresa.
- La ejecutiva accede a sus empresas o procesos asignados.
- El supervisor general puede cambiar entre todas las empresas y procesos.
- Cada supervisor de empresa solo puede acceder y gestionar su organización.
- Una empresa puede mantener varios procesos históricos o futuros.

#### Administración del supervisor general

La sección **Empresas y procesos** permite crear simultáneamente:

1. Una empresa con razón social, RUC, nombre comercial y datos de contacto.
2. Su proceso inicial, código, fechas y ejecutiva responsable.
3. Una cuenta cliente asociada a la nueva empresa.
4. Una cuenta de supervisor limitada a esa empresa.

El nuevo proceso comienza en estado `Planificación`.

#### Proveedores y reportes

- Formulario para registrar proveedores dentro del proceso activo.
- Estados disponibles: `Homologado`, `En proceso`, `Observado` y `Vencido`.
- Los clientes ven el estado sin controles de modificación.
- Reportes CSV compatibles con Excel: directorio general, homologados, en proceso y vencidos.
- Los reportes contienen únicamente información de la empresa y proceso activos.

### Empresas y accesos de demostración

| Empresa | Rol | Correo | Contraseña |
|---|---|---|---|
| DECAL S.A.C. | Cliente | `cliente@decal.com` | `Cliente123` |
| DECAL S.A.C. | Ejecutiva | `ejecutiva@decal.com` | `Ejecutiva123` |
| DECAL S.A.C. | Supervisor de empresa | `supervisor@decal.com` | `Supervisor123` |
| UFITEC S.A.C. | Cliente | `cliente@ufitec.com` | `Cliente123` |
| UFITEC S.A.C. | Ejecutiva | `ejecutiva@ufitec.com` | `Ejecutiva123` |
| UFITEC S.A.C. | Supervisor de empresa | `supervisor@ufitec.com` | `Supervisor123` |
| Todas | Supervisor general | `supervisor@af.com` | `Supervisor123` |

### Estructura funcional

```text
Empresa
├── Usuarios cliente
└── Procesos de homologación
    ├── Ejecutiva responsable
    ├── Proveedores
    ├── Estados y etapas
    └── Reportes
```

### Persistencia actual y siguiente etapa

Este entregable es un prototipo frontend. Empresas, cuentas creadas, procesos y proveedores se guardan en `localStorage`; la sesión se guarda en `sessionStorage`. Esto permite probar los flujos en un navegador, pero no constituye seguridad ni persistencia apropiada para producción.

La siguiente etapa debe incorporar:

- API de servidor con validación de permisos en cada operación.
- Base de datos PostgreSQL u otra equivalente.
- Contraseñas cifradas mediante un proveedor de autenticación.
- Recuperación de contraseña y confirmación de correo.
- Historial auditable de cambios de estado.
- Documentos de homologación almacenados de forma privada.
- Asignación y administración completa de usuarios desde el servidor.
- Copias de seguridad, monitoreo y políticas de conservación de datos.

### Verificación

- Validación estática con TypeScript.
- Compilación de producción con Vite.
- Despliegue en Vercel.
- Comprobación HTTP de las rutas públicas de la aplicación.

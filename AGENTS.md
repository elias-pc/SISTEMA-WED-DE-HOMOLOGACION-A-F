# AGENTS.md

## Rol de Codex

Actúa como desarrollador senior full-stack, arquitecto de software y agente autónomo responsable del desarrollo y mantenimiento del Sistema de Homologación AYF.

Tu prioridad es trabajar de forma segura, rápida y eficiente, reduciendo lecturas innecesarias del repositorio y evitando cambios que puedan romper funcionalidades ya existentes.

El código actual del proyecto es siempre la fuente principal de verdad.

---

# 1. Contexto del proyecto

Proyecto:

Sistema Web de Homologación AYF.

Objetivo principal:

Gestionar y dar seguimiento al proceso de homologación de proveedores para diferentes empresas clientes.

El sistema debe permitir administrar:

- empresas;
- proveedores;
- ejecutivas AYF;
- usuarios;
- roles;
- procesos de homologación;
- estados;
- documentos;
- observaciones;
- seguimiento;
- historial;
- paneles;
- métricas;
- información asociada al proceso de cada proveedor.

El sistema debe mantenerse escalable para soportar múltiples empresas y múltiples proveedores por empresa.

---

# 2. Stack principal

Stack esperado actualmente:

Frontend:
- React
- Vite
- TypeScript

Backend:
- Node.js
- Express

Base de datos:
- PostgreSQL

Infraestructura actual:
- Neon para PostgreSQL administrado
- Vercel para despliegues cuando corresponda

Herramientas:
- Git
- GitHub
- npm

No reemplaces estas tecnologías sin una instrucción explícita.

---

# 3. Repositorio

Repositorio principal:

`elias-pc/SISTEMA-WED-DE-HOMOLOGACION-A-F`

Ramas conocidas:

- `main`
- `desplegar`

Antes de trabajar:

```bash
git status
git branch --show-current
```

Respeta siempre los cambios existentes.

No elimines, reviertas ni sobrescribas cambios del usuario que no formen parte de la tarea actual.

Nunca utilices acciones destructivas como:

```bash
git reset --hard
git clean -fd
git push --force
```

salvo autorización explícita.

---

# 4. Entornos de trabajo

El proyecto se trabaja principalmente en dos entornos:

## Entorno local

Es el entorno principal de desarrollo y pruebas.

Aquí Codex puede:

- modificar archivos;
- crear componentes;
- instalar dependencias;
- ejecutar frontend y backend;
- ejecutar migraciones de desarrollo;
- ejecutar seeds;
- realizar pruebas;
- ejecutar build;
- corregir errores;
- reorganizar código cuando sea necesario;
- actualizar documentación técnica.

Antes de trabajar debe revisar:

```bash
git status
git branch --show-current
```

Debe preservar cualquier cambio local existente del usuario.

El entorno local es donde deben probarse primero los cambios.

## GitHub / Producción

GitHub representa el código versionado que puede utilizarse para despliegues de producción.

Codex NO debe asumir que todo cambio local debe enviarse inmediatamente a GitHub.

Flujo recomendado:

```text
DESARROLLO LOCAL
      ↓
PRUEBAS
      ↓
BUILD
      ↓
REVISIÓN DE CAMBIOS
      ↓
COMMIT
      ↓
PUSH A GITHUB
      ↓
DESPLIEGUE
```

Nunca modificar directamente producción como primer paso.

Primero:

```text
LOCAL → VALIDAR → GITHUB → PRODUCCIÓN
```

No ejecutar automáticamente `push`, `merge`, despliegues o migraciones de producción salvo que la tarea lo requiera explícitamente.

---

# 5. Flujo obligatorio antes de cada tarea

No leas todo el repositorio nuevamente.

Antes de comenzar una tarea sigue este orden:

1. Leer este `AGENTS.md`.
2. Leer `docs/codex/PROJECT_CONTEXT.md`, si existe.
3. Leer `docs/codex/ARCHITECTURE_INDEX.md`, si existe.
4. Leer `docs/codex/CURRENT_STATE.md`, si existe.
5. Identificar el módulo relacionado con la solicitud.
6. Buscar referencias mediante nombres de:
   - componentes;
   - funciones;
   - endpoints;
   - tablas;
   - servicios;
   - rutas;
   - variables;
   - textos visibles;
   - errores.
7. Abrir solamente los archivos directamente relacionados.
8. Revisar dependencias directas cuando sea necesario.
9. Implementar.
10. Validar.

Usa este flujo:

```text
CONTEXTO → BÚSQUEDA → ARCHIVOS RELEVANTES → CAMBIO → PRUEBA → DOCUMENTACIÓN
```

No uses este flujo:

```text
LEER TODO → ANALIZAR TODO → MODIFICAR
```

---

# 6. Memoria técnica persistente

Mantén la carpeta:

`docs/codex/`

con los siguientes documentos.

## PROJECT_CONTEXT.md

Debe contener de manera breve:

- objetivo general;
- stack;
- arquitectura;
- forma de ejecución;
- frontend;
- backend;
- base de datos;
- autenticación;
- despliegue;
- variables importantes;
- comandos habituales.

No conviertas este archivo en documentación extensa.

## ARCHITECTURE_INDEX.md

Este archivo es el índice principal del código.

Debe indicar dónde se encuentra cada funcionalidad.

Ejemplo:

```text
AUTENTICACIÓN
Frontend:
src/...

Backend:
server/...

PROVEEDORES
Frontend:
src/...

Backend:
server/...

EMPRESAS
Frontend:
src/...

Backend:
server/...

HOMOLOGACIÓN
Frontend:
src/...

Backend:
server/...
```

Siempre que aparezca un módulo importante nuevo o cambie de ubicación, actualiza este índice.

Codex debe consultar este archivo antes de hacer búsquedas amplias.

## CURRENT_STATE.md

Mantén información corta sobre:

- funcionalidades terminadas;
- funcionalidades en desarrollo;
- errores conocidos;
- tareas incompletas;
- problemas pendientes;
- bloqueos técnicos;
- entorno actual de trabajo cuando sea relevante.

## DECISIONS.md

Registra decisiones importantes como:

- arquitectura;
- estructura;
- seguridad;
- autenticación;
- base de datos;
- convenciones;
- despliegue.

No vuelvas a discutir una decisión ya registrada salvo que exista un motivo técnico válido.

## CHANGELOG_AI.md

Registra solamente modificaciones importantes realizadas por Codex.

Formato recomendado:

```text
## AAAA-MM-DD

### Tarea
...

### Archivos principales
- ...
- ...

### Resultado
...

### Consideraciones
...
```

No agregues cambios triviales.

---

# 7. Empresas y proveedores

El sistema debe soportar múltiples empresas.

Cada proveedor debe quedar correctamente relacionado con su empresa.

No diseñes lógica pensando que existe una única empresa.

Evita:

```text
empresa fija
empresa hardcodeada
id_empresa = 1
```

salvo que se trate exclusivamente de datos demo.

Todas las consultas relevantes deben respetar la separación entre empresas.

---

# 8. Datos demo

Existen o pueden existir datos de demostración como:

- `empresa1`
- `empresa2`
- `ejecutiva_ayf1`
- `ejecutiva_ayf2`

El entorno demo puede contener aproximadamente 30 proveedores por empresa.

Los datos demo no deben convertirse en dependencias obligatorias del sistema.

Nunca construyas lógica de producción basada directamente en nombres demo.

---

# 9. Base de datos

La base de datos principal actual es PostgreSQL.

Puede utilizarse Neon.

Antes de modificar el esquema:

1. identifica tablas afectadas;
2. revisa relaciones;
3. revisa migraciones;
4. revisa consultas relacionadas;
5. analiza impacto en datos existentes.

No elimines información existente innecesariamente.

Prefiere migraciones compatibles y reversibles.

Nunca ejecutar automáticamente sobre producción:

```text
DROP
TRUNCATE
DELETE masivo
reset de base de datos
seed destructivo
```

---

# 10. Migraciones y seeds

Comandos conocidos o esperados:

```bash
npm run db:migrate
npm run db:seed
```

Variables relacionadas conocidas:

```text
SEED_DEMO_PASSWORD
SEED_SUPERVISOR_PASSWORD
```

Nunca escribas contraseñas directamente en el repositorio.

Utiliza variables de entorno.

Los seeds deben poder ejecutarse de forma predecible y, cuando sea posible, idempotente.

---

# 11. Variables de entorno

Variables conocidas o posibles:

```text
DATABASE_URL
SEED_DEMO_PASSWORD
SEED_SUPERVISOR_PASSWORD
```

Nunca publiques secretos reales.

No escribas credenciales directamente en:

- código;
- commits;
- documentación;
- logs;
- frontend.

Utiliza `.env`, `.env.local`, `.env.development` o `.env.production` según corresponda.

Mantén ejemplos sin secretos en:

`.env.example`

---

# 12. API

Existe o puede existir un endpoint de salud:

`/api/health`

Respuesta esperada:

```json
{
  "status": "ok"
}
```

Si modificas configuración del servidor, despliegue, conexión de base de datos o rutas principales, valida este endpoint.

---

# 13. Backend

Mantén una separación clara entre:

- rutas;
- controladores;
- servicios;
- acceso a datos;
- middleware;
- validaciones.

Evita poner toda la lógica en las rutas de Express.

Preferencia:

```text
route
  ↓
controller
  ↓
service
  ↓
database
```

Cuando la estructura existente sea diferente, respeta primero la arquitectura real antes de imponer una nueva.

---

# 14. Frontend

Mantén separación razonable entre:

- páginas;
- componentes;
- hooks;
- servicios/API;
- tipos;
- utilidades.

No dupliques llamadas HTTP.

Centraliza la comunicación con el backend cuando el proyecto ya tenga una capa de servicios.

Evita lógica compleja dentro del JSX.

---

# 15. TypeScript

Evita utilizar `any` salvo cuando no exista alternativa razonable.

Prefiere tipos e interfaces claras.

No dupliques interfaces que ya existan.

Busca primero definiciones existentes.

---

# 16. Estados de homologación

Los estados del proceso de homologación deben mantenerse consistentes entre:

- frontend;
- backend;
- base de datos;
- filtros;
- reportes;
- dashboards.

Antes de agregar un nuevo estado busca todas las referencias existentes.

No agregues un estado solamente en la interfaz.

---

# 17. Seguridad y permisos

El sistema puede manejar diferentes roles.

Nunca confíes únicamente en ocultar botones del frontend.

Las restricciones importantes deben validarse también en el backend.

Especial atención a:

- usuarios;
- empresas;
- proveedores;
- documentos;
- estados;
- información privada.

Una persona de una empresa no debe acceder accidentalmente a información perteneciente a otra.

---

# 18. Cambios en autenticación

La autenticación es un módulo sensible.

Antes de modificarla revisa:

- login;
- generación de sesión/token;
- middleware;
- almacenamiento frontend;
- expiración;
- permisos;
- logout;
- protección de rutas.

No hagas cambios globales innecesarios para solucionar un error pequeño de login.

---

# 19. Manejo de errores

Backend:

Devuelve errores con códigos HTTP apropiados.

Ejemplos:

```text
400 solicitud inválida
401 no autenticado
403 sin permisos
404 recurso inexistente
409 conflicto
500 error interno
```

Frontend:

Muestra mensajes útiles al usuario.

Evita mostrar directamente:

- stack traces;
- SQL;
- secretos;
- información interna sensible.

---

# 20. Consultas y rendimiento

Evita `SELECT *` cuando la consulta pueda devolver información innecesaria o sensible.

Evita:

- llamadas HTTP duplicadas;
- queries repetitivas;
- N+1 queries;
- renderizados innecesarios;
- cargar listas enormes sin paginación;
- enviar objetos demasiado grandes al frontend.

Las listas de proveedores deberían poder evolucionar hacia filtros, búsqueda y paginación.

---

# 21. No romper funcionalidades existentes

Antes de modificar una función usada en varias partes:

busca todas sus referencias.

Si modificas:

- interfaces;
- tipos;
- funciones compartidas;
- endpoints;
- estructuras JSON;
- tablas;

revisa sus consumidores.

No cambies contratos silenciosamente.

---

# 22. Refactorización

Prioriza cambios pequeños y controlados.

Si la tarea solicita corregir una función puntual, no aproveches para reescribir todo el módulo.

Si detectas deuda técnica no relacionada, déjala documentada como recomendación.

---

# 23. Instalación de dependencias

Antes de instalar una dependencia:

1. revisa `package.json`;
2. verifica si existe una librería equivalente;
3. comprueba compatibilidad;
4. instala solamente si aporta una ventaja real.

Evita dependencias innecesarias.

---

# 24. Ejecución local

Codex debe poder trabajar directamente en el entorno local.

Cuando sea necesario:

- instalar dependencias;
- iniciar frontend;
- iniciar backend;
- ejecutar migraciones;
- ejecutar seed;
- compilar;
- ejecutar pruebas.

No te limites a entregar comandos si tienes capacidad de ejecutarlos.

Primero identifica los scripts reales definidos en `package.json`.

---

# 25. Diagnóstico de errores

Cuando aparezca un error:

1. reproducir;
2. leer el error;
3. localizar origen;
4. identificar causa;
5. implementar corrección;
6. volver a ejecutar;
7. comprobar que no haya regresiones relacionadas.

No modificar código al azar.

---

# 26. Validaciones posteriores

Después de cualquier cambio relevante ejecuta las validaciones disponibles.

Por ejemplo:

```bash
npm run lint
npm run test
npm run build
```

Utiliza únicamente scripts realmente existentes.

Si frontend y backend son proyectos separados, valida ambos cuando la modificación los afecte.

Una tarea no debe darse por terminada si el proyecto deja de compilar.

---

# 27. GitHub

Antes de cualquier operación relacionada con GitHub:

```bash
git status
git branch --show-current
git fetch
```

No ejecutar automáticamente `git pull` si existen cambios locales sin revisar.

Antes de un commit o push:

- revisar `git diff`;
- comprobar que no existan secretos;
- ejecutar pruebas relevantes;
- ejecutar build;
- comprobar archivos modificados.

Commits recomendados:

```text
feat(proveedores): agrega filtro por RUC
fix(auth): corrige validación de sesión
refactor(api): reorganiza servicio de proveedores
docs: actualiza documentación técnica
chore: actualiza configuración
test: agrega pruebas
```

No hacer `push --force`.

---

# 28. Producción, Vercel y Neon

Si se usa Vercel, distinguir entre:

- Development
- Preview
- Production

Revisar especialmente variables como:

`DATABASE_URL`

No asumir que porque algo funciona localmente funcionará automáticamente en producción.

Antes de considerar un cambio listo para producción verificar:

- frontend compila;
- backend inicia;
- `/api/health` responde;
- conexión con base de datos funciona;
- migraciones están correctas;
- variables necesarias están documentadas;
- no existen secretos en el repositorio;
- no hay errores críticos de TypeScript;
- no hay imports rotos.

Nunca expongas la cadena real `DATABASE_URL`.

---

# 29. Control de contexto y tokens

Optimiza el contexto en cada tarea.

No abras decenas de archivos preventivamente.

Primero usa búsquedas.

Si la instrucción es:

`Agregar un filtro por RUC en proveedores`

debes localizar primero:

```text
RUC
Proveedor
lista proveedores
endpoint proveedores
query proveedores
```

y abrir solamente los archivos relacionados.

No es necesario volver a estudiar módulos no relacionados.

---

# 30. Detección de cambios externos

La documentación de `docs/codex/` funciona como memoria, pero puede quedar desactualizada.

Si el código contradice la documentación:

el código actual tiene prioridad.

Actualiza posteriormente la documentación.

No modifiques código válido simplemente para hacerlo coincidir con un documento antiguo.

---

# 31. Actualización automática del conocimiento

Después de terminar una tarea importante actualiza solamente los documentos afectados.

Nueva API:

```text
ARCHITECTURE_INDEX.md
CHANGELOG_AI.md
```

Cambio arquitectónico:

```text
ARCHITECTURE_INDEX.md
DECISIONS.md
PROJECT_CONTEXT.md
CHANGELOG_AI.md
```

Bug pequeño:

actualiza solo lo necesario.

No agregues documentación que no aporte valor futuro.

---

# 32. Principio de mínimo contexto

Antes de abrir cualquier archivo pregúntate:

`¿Este archivo es necesario para resolver la tarea?`

Si la respuesta es no, no lo leas.

---

# 33. Principio de mínimo cambio

Antes de modificar código pregúntate:

`¿Puedo resolver correctamente el problema con un cambio más pequeño?`

Si sí, utiliza el cambio más pequeño.

---

# 34. Autonomía

Cuando la solicitud sea suficientemente clara:

no pidas confirmación para cada paso.

Ejecuta el trabajo necesario y entrega el resultado.

Solo detente cuando exista riesgo importante de:

- pérdida de datos;
- eliminación masiva;
- sobrescribir trabajo del usuario;
- modificar producción;
- exponer secretos;
- realizar una acción irreversible.

---

# 35. Resultado final de cada tarea

Cuando termines responde brevemente:

```text
Implementado.

Cambios:
- ...
- ...

Validación:
- ...
- ...

Estado:
- correcto / error pendiente
```

Evita explicaciones excesivamente largas salvo que sean necesarias.

---

# 36. Regla principal del Sistema de Homologación

Mantén siempre estas prioridades:

1. Integridad de los datos.
2. Separación correcta entre empresas.
3. Seguridad y permisos.
4. No romper funcionalidades existentes.
5. Mantener arquitectura.
6. Cambios pequeños y controlados.
7. Validar antes de terminar.
8. Mantener actualizado el índice técnico.

---

# 37. Ciclo de trabajo obligatorio

En cada tarea utiliza:

```text
ENTENDER
   ↓
CONSULTAR MEMORIA
   ↓
LOCALIZAR
   ↓
INSPECCIONAR SOLO LO NECESARIO
   ↓
IMPLEMENTAR
   ↓
VALIDAR
   ↓
ACTUALIZAR CONTEXTO
```

Evita:

```text
LEER TODO EL REPOSITORIO
   ↓
VOLVER A ENTENDER TODO
   ↓
CONSUMIR CONTEXTO INNECESARIO
```

El objetivo es que cada nueva tarea aproveche el conocimiento adquirido anteriormente y que Codex pueda localizar rápidamente la parte del Sistema de Homologación que necesita modificar.

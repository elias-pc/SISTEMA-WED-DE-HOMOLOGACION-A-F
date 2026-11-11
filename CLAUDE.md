# Sistema Web de Homologación A&F: forma de trabajo

En este repositorio trabajan **dos agentes Claude** en coordinación, y el dueño del proyecto es **Elías**:

- **Claude VS Code**: trabaja en la PC de Elías, en la rama `desarrollo_local`.
- **Claude Web**: trabaja en claude.ai/code, **directamente en la rama `desplegar`** (decisión de Elías).

## No ejecutar el sistema en local
La PC de Elías tiene poca memoria. **No ejecutes** `npm install`, `npm run dev`, `npm run build`, `vite`, `docker-compose` ni ningún servidor o base de datos local.
El trabajo es solo **editar código, hacer commit y push**. Vercel construye cada rama y genera su vista previa en línea.

## Ramas
| Rama | Dueño | Vista previa (Vercel) |
|---|---|---|
| `desarrollo_local` | Claude VS Code | https://sistema-wed-de-homologacion-git-desarrollolocal-systen.vercel.app |
| `desplegar` | Claude Web trabaja aquí; también es la rama de pruebas finales | https://sistema-wed-de-homologacion-git-desplegar-systen.vercel.app |
| `main` | Producción (nadie hace push directo) | https://sistema-wed-de-homologacion.vercel.app |

Para abrir las vistas previas hay que tener iniciada la sesión de Vercel.

## Reglas
1. Cada agente trabaja **solo en su propia rama**. Claude Web no toca `desarrollo_local`. Claude VS Code solo sube a `desplegar` con el paso 5 (push normal, nunca forzado), así no pisa el trabajo de Claude Web.
2. **Nunca** hagas push directo a `main`. **Nunca** uses `--force` en `main` ni en `desplegar`.
3. **Antes de cada tarea**, pon tu rama al día (cambia `<mi-rama>` por tu rama):
   ```bash
   git fetch origin
   git checkout <mi-rama>
   git rebase origin/desplegar
   ```
4. **Después de cada cambio:** commit con un mensaje claro y push a tu rama:
   ```bash
   git push --force-with-lease origin <mi-rama>
   ```
   Luego dile a Elías que en 1–2 minutos puede ver el cambio en la vista previa de tu rama.
   Si Elías dice que el build falló en Vercel, pídele el error y corrígelo.
5. **Cuando Elías diga que el cambio está bien**, pásalo a pruebas:
   ```bash
   git fetch origin
   git rebase origin/desplegar
   git push --force-with-lease origin <mi-rama>
   git push origin <mi-rama>:desplegar
   ```
   Si el último push es rechazado, es que el otro agente subió algo a `desplegar`: repite estos pasos desde `git fetch`.
6. **Paso a producción, solo cuando Elías diga "aprobado"** para lo que está en `desplegar`:
   ```bash
   git fetch origin
   git push origin origin/desplegar:main
   ```
   Si es rechazado, **no lo fuerces**: avísale a Elías.
7. Si un rebase da conflictos con trabajo del otro agente, conserva los dos cambios. Si no está claro cuál debe quedar, pregúntale a Elías.

## Base de datos (Neon, proyecto `af-homologacion`)
- Producción usa la branch de Neon `main`, con datos reales. Todas las vistas previas usan la branch `preview`, una copia donde se puede probar libremente.
- En Vercel, `DATABASE_URL` está separada para Production y Preview. **No la cambies.** Nunca subas `.env` ni credenciales al repositorio.
- Si un cambio necesita migraciones de base de datos, avísale a Elías antes. Se aplican primero en `preview` y en producción solo después del "aprobado".

## Flujo
Elías pide un cambio → el agente edita y sube a su rama → Elías lo ve en la vista previa de esa rama → pasa a `desplegar` → Elías dice "aprobado" → `desplegar` pasa a `main` y queda en producción.

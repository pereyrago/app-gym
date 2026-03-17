# Orden para resetear y poblar la base (dev)

Si ejecutás **drop** → **schema** → **seed** y el seed crea casi nada, es porque el seed necesita **al menos un usuario en Auth** para crear el perfil y el profesor al que se asocian alumnos y clases.

## Claves Supabase (Publishable vs Secret)

- **Publishable (anon)**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`. La app usa esta clave en el servidor junto con la sesión (cookies/JWT) del usuario; RLS decide qué datos puede ver.
- **Secret**: `SUPABASE_SECRET_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`). Solo para operaciones Auth Admin: crear admin (`scripts/create-admin.js`), crear/eliminar profesores, resetear contraseña. No se usa para leer perfil ni dashboard.

## Orden correcto

1. **drop-public-schema.sql**  
   Borra todo el schema `public` (auth no se toca).

2. **schema.sql**  
   Vuelve a crear tablas, funciones, RLS y el trigger que crea el perfil al registrar un usuario.

3. **Crear el usuario admin**

   ```bash
   node scripts/create-admin.js
   ```

   Así queda un usuario en `auth.users`.

4. **fix-missing-profile.sql** (SQL Editor)  
   Crea en `public.profiles` la fila para los usuarios de Auth que no tengan. Hacelo siempre después de create-admin; si no, suele aparecer "Perfil no encontrado".

5. **seed.sql**  
   Crea períodos, tipos de clase, un profesor, alumnos, clases, asistencias y faltas.

## Resumen

| Paso | Archivo / comando                         |
| ---- | ----------------------------------------- |
| 1    | `drop-public-schema.sql` (SQL Editor)     |
| 2    | `schema.sql` (SQL Editor)                 |
| 3    | `node scripts/create-admin.js` (terminal) |
| 4    | `fix-missing-profile.sql` (SQL Editor)    |
| 5    | `seed.sql` (SQL Editor)                   |

Después del paso 4, cerrá sesión en la app y volvé a entrar.

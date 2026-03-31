# App Gym - Gestión de horas de clases

Aplicación full-stack para gestión de clases, profesores, alumnos y asistencias.

## Stack

- **Next.js 15** (App Router)
- **TypeScript** (strict)
- **Supabase** (Auth, Database, RLS)
- **shadcn/ui** + TailwindCSS
- **React Hook Form** + Zod
- **jsPDF** para generación de informes
- ESLint, Prettier, Husky, lint-staged

## Requisitos

- Node.js 18+
- pnpm
- Cuenta de Supabase

## Instalación

1. **Clonar e instalar dependencias**

```bash
cd app-gym
pnpm install
```

2. **Variables de entorno**

Copiar `.env.example` a `.env.local` y completar con los valores de tu proyecto Supabase:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto (Dashboard → Settings → API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Publishable key (anon). Usada en toda la app con la sesión del usuario.
- `SUPABASE_SECRET_KEY`: Secret key. Solo para Auth Admin (crear admin, profesores, resetear contraseña). Opcional si no usás esas funciones.

3. **Base de datos Supabase**

Aplicar migraciones en el orden indicado (Dashboard → SQL Editor o CLI):

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_class_24h_rule.sql`
- `supabase/migrations/003_handle_new_user.sql`

4. **Usuario admin inicial**

Crear el primer usuario desde Supabase Dashboard (Authentication → Add user) con email y contraseña. Luego ejecutar en SQL Editor:

```sql
-- Sustituir YOUR_ADMIN_EMAIL por el email del usuario creado
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'YOUR_ADMIN_EMAIL';
```

Si la tabla `profiles` no tiene fila para ese usuario (por ejemplo si se creó antes del trigger), insertar manualmente:

```sql
INSERT INTO public.profiles (id, email, full_name, role)
SELECT id, email, raw_user_meta_data->>'full_name', 'admin'
FROM auth.users
WHERE email = 'YOUR_ADMIN_EMAIL'
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

5. **Arrancar el proyecto**

```bash
pnpm dev
```

Abrir [http://localhost:3000](http://localhost:3000). Iniciar sesión con el usuario admin y crear períodos y profesores desde el panel.

## Scripts

| Comando          | Descripción                |
| ---------------- | -------------------------- |
| `pnpm dev`       | Desarrollo                 |
| `pnpm build`     | Build de producción        |
| `pnpm start`     | Servidor de producción     |
| `pnpm lint`      | Ejecutar ESLint            |
| `pnpm typecheck` | Verificar tipos TypeScript |
| `pnpm format`    | Formatear con Prettier     |
| `pnpm test`      | Tests (Vitest)             |

Pre-commit (Husky + lint-staged): ejecuta `lint-staged` y `pnpm typecheck` .

## Roles

- **admin**: Crear/eliminar profesores, ver todos los profesores y sus clases, crear períodos, generar PDFs (un profesor o todos).
- **profesor**: Crear alumnos y clases, ver sus clases por período, cargar asistentes por clase.

## Regla de negocio: 24 horas

Una clase **no puede editarse ni eliminarse** después de 24 horas desde su creación. La validación se aplica en:

- **Servidor**: políticas RLS en Supabase (UPDATE/DELETE en `classes`).
- **UI**: badge "Editable" / "No editable (24h)" y deshabilitar formulario de asistencias cuando ya no es editable.
- **Tests**: `lib/class-utils.test.ts` (helper `classCanBeEdited`).

## Estructura principal

```
app/
  (auth)/
  admin/           # Panel admin
  teacher/         # Panel profesor
  login/
  auth/callback/
components/
  ui/              # shadcn
features/
  admin/
  teacher/
  auth/
lib/
  supabase/
  auth/
  class-utils.ts
  pdf.ts
repositories/
services/
validations/
types/
hooks/
supabase/
  migrations/
```

## Generación de PDFs

En **Admin → Informes** se puede:

- Generar PDF de un profesor (clases y asistencias en un período).
- Generar PDF de todos los profesores del período.

Los PDFs se generan en el cliente con jsPDF a partir de los datos devueltos por las server actions.

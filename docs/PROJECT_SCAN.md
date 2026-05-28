# App Gym — Escaneo del proyecto

> **Generado:** 2026-05-28  
> **Propósito:** Referencia para mantenimiento, onboarding y decisiones de desarrollo con el agente.  
> **Revisar:** Tras cambios grandes en schema, roles, o rutas públicas.

## Resumen ejecutivo

**App Gym** es una app full-stack de gestión de clases de gimnasio: profesores, alumnos, asistencias, períodos, informes PDF y dashboard analítico para administradores. Stack: **Next.js 15 (App Router)**, **React 19**, **TypeScript strict**, **Supabase** (Auth + Postgres + RLS), **shadcn/ui**, **Zod**, **Vitest**.

| Métrica | Valor |
|--------|--------|
| Archivos `.ts` / `.tsx` (sin `node_modules`, `.next`, `.agents`) | ~171 |
| Tests Vitest | 4 archivos (`lib/*`, `validations/*`) |
| Server Actions | ~10 módulos `actions.ts` |
| Capa datos | `repositories/` + `services/` (fino) |
| Migraciones SQL en repo | `016`, `017`, `018` (+ `schema.sql` consolidado 001–015) |

## Skills instaladas (proyecto)

Ubicación: `.agents/skills/` (lock: `skills-lock.json`). Cursor las detecta automáticamente.

| Skill | Origen | Uso |
|-------|--------|-----|
| `find-skills` | `vercel-labs/skills` | Buscar e instalar más skills (`npx skills find …`) |
| `vercel-react-best-practices` | `vercel-labs/agent-skills` | React 19 / Next.js 15: rendimiento, RSC, data fetching |
| `supabase` | `mindrally/skills` | Auth SSR, RLS, migraciones, patrones Postgres |
| `web-design-guidelines` | `vercel-labs/agent-skills` | Auditoría UI/UX y accesibilidad |
| `pdf-generation` | `claude-dev-suite/claude-dev-suite` | Maquetación PDF (jsPDF; ver `lib/pdf.ts`) |

Detalle completo: **[docs/SKILLS.md](SKILLS.md)**.

Comandos útiles:

```bash
npx skills list
npx skills find <tema>
npx skills add <owner/repo@skill> --agent cursor -y
```

## Arquitectura de capas

```
app/              → Rutas App Router, layouts, Server Actions por dominio
features/         → UI por rol (admin, teacher, auth) — componentes de pantalla
components/       → UI compartida (dashboard charts, shadcn ui/)
lib/              → Supabase clients, auth helpers, reglas de negocio (class-utils, pdf)
repositories/     → Acceso a Supabase (queries tipadas)
services/         → Orquestación fina (createClass, createTeacher, …)
validations/      → Esquemas Zod (+ tests)
types/            → `database.types.ts`, roles, dominio
supabase/         → schema.sql, migraciones incrementales, seed, scripts SQL
```

**Convención:** Las páginas llaman Server Actions o `repositories/`; `services/` agrupa operaciones que combinan validación + persistencia. Auth en servidor vía `lib/auth` (`requireAdmin`, `requireTeacher`, `getProfile`).

## Rutas y roles

### Middleware (`middleware.ts` → `lib/supabase/middleware.ts`)

- Sesión Supabase en cookies (`@supabase/ssr`).
- Sin usuario → redirect `/login` (excepto `/`, `/p/*`, `/login`, `/auth/callback`, `/api/debug-auth`).
- Usuario autenticado en página de auth → redirect `/admin` (los layouts de teacher redirigen según rol si aplica).

### App Router

| Área | Ruta base | Rol |
|------|-----------|-----|
| Pública | `/`, `/p/[slug]` | QR / registro asistencia por slug del profesor |
| Auth | `/login`, `/auth/sin-perfil` | Login; usuario sin perfil |
| Admin | `/admin/*` | `admin` — dashboard, profesores, alumnos, períodos, tipos de clase, informes |
| Profesor | `/teacher/*` | `profesor` — clases, alumnos, grupos, QR |

Layouts: `app/admin/layout.tsx`, `app/teacher/layout.tsx` — deben validar rol con `requireAdmin` / `requireTeacher`.

## Supabase

### Clientes

| Archivo | Uso |
|---------|-----|
| `lib/supabase/server.ts` | Server Components / Actions — anon + cookies |
| `lib/supabase/client.ts` | Cliente browser |
| `lib/supabase/admin.ts` | Secret key — Auth Admin (crear profesores, reset password) |
| `lib/supabase/middleware.ts` | Refresh sesión en edge |

### Tablas principales (`schema.sql`)

`profiles`, `teachers`, `periods`, `class_types`, `students`, `classes`, `class_attendances`, `class_absences`, `student_shares`, `teacher_student_groups`, `teacher_student_group_members`.

### Seguridad

- **RLS** en todas las tablas públicas.
- Helpers: `get_user_role()`, `is_admin()`, `get_my_teacher_id()`, `teacher_can_use_student`, etc.
- Formularios públicos (`/p/[slug]`): políticas que permiten `anon` insert/select acotado por `public_slug`.

### Migraciones recientes (revisar en prod)

- **016** — Grupos de alumnos por profesor.
- **017** — **Elimina regla de 24h en RLS** para editar/borrar clases (políticas sin `class_can_edit`).
- **018** — Limpieza permisos profesor sobre alumnos.

> **Desincronización documentada:** `README.md` y `lib/class-utils.ts` aún describen la regla de 24h; la UI puede seguir mostrando badges según `classCanBeEdited`. Verificar si la regla sigue solo en cliente o debe alinearse con migración 017.

### Dev / reset DB

Orden en `supabase/README-SETUP.md`: drop → schema → `scripts/create-admin.js` → fix-missing-profile → seed.

### Tipos TS

```bash
pnpm db:types   # requiere SUPABASE_PROJECT_ID
```

## Variables de entorno (`.env.example`)

| Variable | Rol |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyecto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública + RLS |
| `SUPABASE_SECRET_KEY` | Auth Admin (opcional sin panel profesores) |
| `NEXT_PUBLIC_APP_TIMEZONE` | Fechas clases (default Argentina) |
| `AUTO_APPROVE_QR_STUDENTS` | Aprobar alumnos registrados por QR |

## Dominio de negocio (clave)

- **Roles:** `admin` | `profesor` (`AppRole` en `types/`).
- **Clases:** estados `success`, `cancel_by_student`, `cancel_by_teacher`; alcance `individual` | `shared`.
- **Alumnos:** status, soft delete (`deleted_at`), compartición entre profesores (`student_shares`).
- **Dashboard admin:** KPIs y gráficos Recharts en `components/dashboard/`, datos en `repositories/dashboard*.ts`.
- **PDFs:** jsPDF en cliente (`lib/pdf.ts`) desde datos de `app/admin/reports/actions.ts`. Usar skill `pdf-generation` al maquetar informes.
- **WhatsApp:** `lib/whatsapp-url.ts` para enlaces de contacto.

## Calidad y tooling

| Herramienta | Config |
|-------------|--------|
| ESLint | `eslint-config-next` + prettier |
| Prettier | scripts `format` / `format:check` |
| Husky | pre-commit: lint-staged + `typecheck` |
| Vitest | `vitest.config.ts`, pocos tests de reglas |

## Design system

`.interface-design/system.md` — densidad alta, slate, bordes sin sombras fuertes; alinear nuevas pantallas admin/teacher con esos tokens.

## Áreas de mantenimiento frecuente

1. **RLS + Server Actions** — Cualquier nueva tabla o endpoint debe tener políticas y probar con rol anon/profesor/admin.
2. **Migraciones** — Añadir SQL en `supabase/migrations/` y actualizar `schema.sql` si se usa reset completo.
3. **Tipos** — Regenerar `types/database.types.ts` tras cambios de schema.
4. **Rutas públicas `/p/[slug]`** — Flujo QR, timezone, `AUTO_APPROVE_QR_STUDENTS`.
5. **README vs código** — Mantener alineados README, regla 24h y migración 017.

## Próximos pasos sugeridos (opcional)

- [ ] Alinear documentación y `classCanBeEdited` con migración 017.
- [ ] Ampliar tests en `validations/` y repositorios críticos.
- [ ] Skill de proyecto propia (`npx skills init app-gym`) con enlaces a este doc.
## Historial de este escaneo

| Fecha | Notas |
|-------|--------|
| 2026-05-28 | Escaneo inicial + skills find-skills, vercel-react-best-practices, supabase |
| 2026-05-28 | + web-design-guidelines, pdf-generation; docs/SKILLS.md |

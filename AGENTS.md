# Guía para agentes — App Gym

## Contexto del proyecto

Leer primero **[docs/PROJECT_SCAN.md](docs/PROJECT_SCAN.md)** para arquitectura, rutas, Supabase, reglas de negocio y deuda documentada.

## Skills del repositorio

Instaladas en `.agents/skills/` — catálogo en **[docs/SKILLS.md](docs/SKILLS.md)** (`skills-lock.json`).

| Skill | Uso principal |
|-------|----------------|
| **find-skills** | Descubrir más skills (`npx skills find …`) |
| **vercel-react-best-practices** | Next.js 15 / React 19 |
| **supabase** | Auth, RLS, migraciones |
| **web-design-guidelines** | Revisar UI/UX (ver también `.interface-design/system.md`) |
| **pdf-generation** | Informes PDF — implementación actual en `lib/pdf.ts` (jsPDF) |

## Convenciones al editar

- Respetar capas: `app/` → `features/` → `repositories/` / `services/` → Supabase.
- Validar con Zod en `validations/`; tipos en `types/database.types.ts`.
- Auth servidor: `lib/auth` (`requireAdmin`, `requireTeacher`).
- No commitear `.env.local` ni secretos.
- Tras cambios de schema: migración SQL + considerar `pnpm db:types` y actualizar `schema.sql` si aplica al flujo de reset.
- PDFs: extender `lib/pdf.ts`; datos desde `app/admin/reports/`.

## Comandos

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm db:types   # con SUPABASE_PROJECT_ID
npx skills list
```

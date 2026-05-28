# Skills del proyecto — App Gym

Skills de agente instaladas a nivel **proyecto** para Cursor (y otros agentes compatibles). El catálogo se gestiona con [skills CLI](https://skills.sh/) (`npx skills`).

## Ubicación

| Archivo / carpeta | Descripción |
|-------------------|-------------|
| `.agents/skills/<nombre>/` | Contenido de cada skill (`SKILL.md` + referencias) |
| `skills-lock.json` | Versiones y hashes para reproducir instalaciones |
| `docs/PROJECT_SCAN.md` | Contexto del código (arquitectura, Supabase, PDFs) |
| `AGENTS.md` | Entrada rápida para agentes |

## Skills instaladas

| Skill | Origen | Cuándo usarla |
|-------|--------|----------------|
| **find-skills** | [vercel-labs/skills](https://skills.sh/vercel-labs/skills/find-skills) | Buscar e instalar nuevas skills (`npx skills find …`) |
| **vercel-react-best-practices** | [vercel-labs/agent-skills](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices) | Next.js 15, React 19, RSC, rendimiento, Server Actions |
| **supabase** | [mindrally/skills](https://skills.sh/mindrally/skills/supabase) | Auth SSR, RLS, migraciones, Postgres |
| **web-design-guidelines** | [vercel-labs/agent-skills](https://skills.sh/vercel-labs/agent-skills/web-design-guidelines) | Revisar UI, accesibilidad, UX; alinear con `.interface-design/system.md` |
| **pdf-generation** | [claude-dev-suite/claude-dev-suite](https://skills.sh/claude-dev-suite/claude-dev-suite/pdf-generation) | Maquetar o ampliar informes PDF (jsPDF, PDFKit, HTML→PDF) |

### PDF en este repo

Los informes de profesores se generan en **cliente** con **jsPDF** (`lib/pdf.ts`), invocados desde **Admin → Informes** (`app/admin/reports/`). La skill **pdf-generation** cubre patrones de:

- `jsPDF` — coordenadas mm, `splitTextToSize`, paginación, tablas
- PDFKit / Puppeteer — si en el futuro se migra a server-side o HTML→PDF

**Código de referencia:** `lib/pdf.ts` (`generateTeacherPdf`, logo SVG→PNG, márgenes A4, formato `es-AR`).

**Skill evaluada y descartada:** `jmsktm/claude-settings@PDF Generator` (orientada a Markdown→Puppeteer; menos alineada con el flujo actual).

## Comandos

```bash
# Listar skills del proyecto
npx skills list

# Buscar en el ecosistema
npx skills find pdf
npx skills find nextjs

# Instalar (ejemplo)
npx skills add vercel-labs/agent-skills@web-design-guidelines --agent cursor -y

# Quitar una skill
npx skills remove <nombre-carpeta> -y

# Restaurar desde lock (otra máquina / CI)
npx skills experimental_install
```

## Instalar en otra máquina

Tras clonar el repo:

```bash
npx skills experimental_install
```

O reinstalar manualmente las entradas de `skills-lock.json` con `npx skills add …`.

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-05-28 | Escaneo inicial: find-skills, vercel-react-best-practices, supabase |
| 2026-05-28 | + web-design-guidelines, pdf-generation; docs SKILLS.md |

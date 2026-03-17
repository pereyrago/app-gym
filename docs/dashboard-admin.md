# Dashboard administrativo

Panel de métricas para administradores (app de gestión de clases de gimnasio).

## Stack

- **Next.js** (App Router), **TypeScript**, **shadcn/ui**, **Recharts**, **Supabase** (PostgreSQL).

## Estructura

```
app/admin/dashboard/
  page.tsx          # Página principal (server component, lee searchParams y fetchea datos)
  loading.tsx       # Skeleton mientras carga

components/dashboard/
  dashboard-header.tsx
  dashboard-filters.tsx   # Client: filtros que actualizan URL
  kpi-card.tsx
  section-card.tsx
  business-insights.tsx
  teachers-ranking-table.tsx   # Client: tabla ordenable
  charts/
    classes-by-day-chart.tsx
    attendance-by-day-chart.tsx
    attendance-by-weekday-chart.tsx
    attendance-by-time-slot-chart.tsx
    students-activity-donut-chart.tsx
    new-students-by-month-chart.tsx
    active-students-evolution-chart.tsx
    students-by-teacher-chart.tsx
    teacher-performance-bars.tsx
    class-type-performance-chart.tsx
    class-type-distribution-donut.tsx
    attendance-by-class-type-stacked-chart.tsx

features/dashboard/
  types.ts          # DashboardFilters, DashboardKpis, tipos de series para charts
  constants.ts      # ACTIVITY_STATUS_LABELS, etc.

repositories/
  dashboard-queries.ts   # Llamadas a RPCs de Supabase (get_dashboard_kpis, get_classes_by_day, ...)
```

## Base de datos

Ejecutar la migración **`supabase/migrations/007_dashboard_functions.sql`** para crear las funciones RPC que alimentan el dashboard:

- `get_dashboard_kpis(period_id, date_from, date_to, teacher_id, class_type_id)` → una fila con total alumnos, activos, inactivos, en riesgo, profesores, clases, asistencias, promedio por clase, tipos de clase, tasa de actividad.
- `get_classes_by_day(...)` → clases por día.
- `get_attendance_by_day(...)` → asistencias por día.
- `get_attendance_by_weekday(...)` → asistencias por día de la semana.
- `get_attendance_by_time_slot(...)` → asistencias por franja horaria.
- `get_students_activity_summary(date_from, date_to)` → activos / inactivos / en riesgo (para donut).
- `get_new_students_by_month(date_from, date_to)` → nuevos alumnos por mes.
- `get_active_students_evolution(...)` → evolución de alumnos activos (ventana 15 días) por día.
- `get_teachers_performance_summary(...)` → ranking de profesores (clases, alumnos únicos, asistencias, promedio por clase, última clase).
- `get_students_by_teacher()` → alumnos por profesor.
- `get_class_type_performance_summary(...)` → rendimiento por tipo de clase.
- `get_attendance_by_class_type_over_time(...)` → asistencia por tipo en el tiempo (área apilada).

Todas las funciones son **SECURITY DEFINER** y usan `search_path = public`. Deben invocarse con el **service role** (admin) desde el backend.

## Filtros

Los filtros se pasan por **URL** (`period_id`, `date_from`, `date_to`, `teacher_id`, `class_type_id`). Por defecto se usa el rango del período actual (o últimos 30 días si no hay período). Todos los widgets reaccionan a estos filtros.

## Secciones del dashboard

1. **Header y filtros** – Título, descripción, selectores de período, rango de fechas, profesor y tipo de clase.
2. **KPIs principales** – Cards con total alumnos, activos, inactivos, en riesgo, profesores activos, clases, asistencias, promedio por clase, tipos de clase, tasa de actividad.
3. **Actividad de clases** – Clases por día (LineChart), asistencias por día (AreaChart), día de la semana con más asistencia (BarChart), franja horaria con más asistencia (BarChart horizontal).
4. **Análisis de alumnos** – Activos vs inactivos vs riesgo (PieChart donut), nuevos alumnos por mes (BarChart), evolución de alumnos activos (LineChart), distribución por profesor (BarChart horizontal).
5. **Rendimiento de profesores** – Barras por más clases, más asistencias y promedio por clase; tabla ranking (ordenable por columnas).
6. **Análisis por tipo de clase** – Tipo con más asistencia (BarChart), distribución de clases por tipo (donut), evolución por tipo (AreaChart apilado).
7. **Insights de negocio** – Cards con tasa de actividad, promedio por clase, franja pico, día con más asistencia, tipo con más demanda, profesor con mejor promedio, alumnos en riesgo, etc.

## Definiciones de negocio

- **Alumno activo**: asistió al menos una vez en los últimos 15 días.
- **Alumno inactivo**: no asistió en los últimos 15 días.
- **Alumno en riesgo**: no asistió en los últimos 30 días.
- **Promedio de alumnos por clase**: total asistencias / total clases (en el período filtrado).

## UX

- Mobile-first, responsive (grid que colapsa a 1–2 columnas en móvil).
- Loading: `loading.tsx` con skeletons.
- Empty states: mensaje "Sin datos" en cada chart cuando no hay filas.
- Accesibilidad: labels en filtros, `aria-label` donde aplica, contraste y tipografía legible.

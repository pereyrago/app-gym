/**
 * Clasificación de actividad de un alumno (Dashboard Ejecutivo, Bloque 6 y 10).
 *
 * Activo: entrenó durante el período seleccionado, o su última clase fue hace 14 días o menos.
 * En riesgo: no entrena hace más de 14 días (y 30 o menos).
 * Inactivo: no entrena hace más de 30 días, o nunca entrenó.
 *
 * El OR con "últimos 14 días" evita que un alumno que entrena regularmente pero no
 * dentro de una ventana de filtro angosta (ej. "Hoy") caiga fuera de las tres categorías.
 *
 * Espeja la lógica de los umbrales en get_dashboard_kpis/get_students_activity_summary
 * (supabase/migrations/021_activity_status_definitions_v2.sql) para que el criterio de
 * negocio tenga una única definición testeable en TypeScript.
 */
export type StudentActivityStatus = "active" | "at_risk" | "inactive";

export function classifyStudentActivity(
  lastAttendanceDate: string | null,
  referenceDate: Date,
  attendedInPeriod: boolean
): StudentActivityStatus {
  if (attendedInPeriod) return "active";
  if (!lastAttendanceDate) return "inactive";

  const last = new Date(lastAttendanceDate);
  const daysSince = Math.floor(
    (referenceDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince <= 14) return "active";
  if (daysSince <= 30) return "at_risk";
  return "inactive";
}

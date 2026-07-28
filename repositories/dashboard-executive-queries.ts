import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DashboardFilters,
  ExecutiveSummaryKpis,
  BusinessEvolutionRow,
  TeacherRankingRow,
  StudentRankingRow,
} from "@/features/dashboard/types";
import { toRpcParams } from "@/repositories/dashboard-queries";

/**
 * RPCs específicas del Dashboard Ejecutivo (Bloques del spec Dashboard.pdf).
 * Reutiliza toRpcParams/toRpcParamsNoScope de dashboard-queries.ts para no
 * duplicar la construcción de filtros compartida con las RPCs preexistentes.
 */
export async function getExecutiveSummaryKpis(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<ExecutiveSummaryKpis | null> {
  const { data, error } = await supabase.rpc("get_executive_summary_kpis", toRpcParams(filters));
  if (error) {
    console.error("get_executive_summary_kpis", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  const metric = (current: unknown, previous: unknown, variationPct: unknown) => ({
    current: Number(current ?? 0),
    previous: Number(previous ?? 0),
    variationPct: Number(variationPct ?? 0),
  });

  return {
    activeStudents: metric(
      row.active_students_current,
      row.active_students_previous,
      row.active_students_variation_pct
    ),
    classes: metric(row.classes_current, row.classes_previous, row.classes_variation_pct),
    teachers: metric(row.teachers_current, row.teachers_previous, row.teachers_variation_pct),
    cancellations: metric(
      row.cancellations_current,
      row.cancellations_previous,
      row.cancellations_variation_pct
    ),
    hours: metric(row.hours_current, row.hours_previous, row.hours_variation_pct),
    attendanceRatePct: metric(
      row.attendance_rate_current,
      row.attendance_rate_previous,
      row.attendance_rate_variation_pct
    ),
    newStudents: metric(
      row.new_students_current,
      row.new_students_previous,
      row.new_students_variation_pct
    ),
  };
}

export async function getBusinessEvolutionByDay(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<BusinessEvolutionRow[]> {
  const { data, error } = await supabase.rpc("get_business_evolution_by_day", toRpcParams(filters));
  if (error) {
    console.error("get_business_evolution_by_day", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    day: String(r.day ?? ""),
    classes_count: Number(r.classes_count ?? 0),
    hours: Number(r.hours ?? 0),
    active_students_count: Number(r.active_students_count ?? 0),
    new_students_count: Number(r.new_students_count ?? 0),
    cancellations_count: Number(r.cancellations_count ?? 0),
  }));
}

export async function getTeacherRankingMetrics(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<TeacherRankingRow[]> {
  const { data, error } = await supabase.rpc("get_teacher_ranking_metrics", {
    p_date_from: filters.dateFrom ?? null,
    p_date_to: filters.dateTo ?? null,
    p_student_id: filters.studentId ?? null,
    p_scope: filters.classMode ?? null,
  });
  if (error) {
    console.error("get_teacher_ranking_metrics", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    teacher_id: String(r.teacher_id ?? ""),
    teacher_name: String(r.teacher_name ?? ""),
    classes_count: Number(r.classes_count ?? 0),
    unique_students: Number(r.unique_students ?? 0),
    hours: Number(r.hours ?? 0),
    cancellations_count: Number(r.cancellations_count ?? 0),
    attendance_pct: Number(r.attendance_pct ?? 0),
  }));
}

/** Omite p_student_id: es un ranking entre alumnos, filtrar a "uno solo" no tendría sentido. */
export async function getStudentRankingMetrics(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<StudentRankingRow[]> {
  const { data, error } = await supabase.rpc("get_student_ranking_metrics", {
    p_date_from: filters.dateFrom ?? null,
    p_date_to: filters.dateTo ?? null,
    p_teacher_id: filters.teacherId ?? null,
    p_scope: filters.classMode ?? null,
  });
  if (error) {
    console.error("get_student_ranking_metrics", error);
    return [];
  }
  const todayMs = Date.now();
  return (data ?? []).map((r: Record<string, unknown>) => {
    const lastClassDate = r.last_class_date != null ? String(r.last_class_date) : null;
    const daysSinceLastClass = lastClassDate
      ? Math.floor((todayMs - new Date(lastClassDate).getTime()) / (24 * 60 * 60 * 1000))
      : null;
    return {
      student_id: String(r.student_id ?? ""),
      student_name: String(r.student_name ?? ""),
      classes_count: Number(r.classes_count ?? 0),
      cancellations_count: Number(r.cancellations_count ?? 0),
      last_class_date: lastClassDate,
      created_at: String(r.created_at ?? ""),
      days_since_last_class: daysSinceLastClass,
    };
  });
}

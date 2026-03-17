import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DashboardFilters,
  DashboardKpis,
  DayCount,
  WeekdayCount,
  TimeSlotCount,
  StudentsActivityRow,
  NewStudentsByMonth,
  ActiveStudentsEvolutionRow,
  TeacherPerformanceRow,
  StudentsByTeacherRow,
  ClassTypePerformanceRow,
  AttendanceByClassTypeOverTimeRow,
  StudentCancellationRow,
  TeacherCancellationRow,
  IndividualVsSharedOverTimeRow,
  IndividualVsSharedByTeacherRow,
  CancellationKpisRow,
  CancellationReasonRow,
  CancellationsByMonthRow,
  CancellationsByTeacherOverTimeRow,
  IndividualVsSharedTotalsRow,
} from "@/features/dashboard/types";

function toRpcParams(f: DashboardFilters) {
  return {
    p_period_id: f.periodId ?? null,
    p_date_from: f.dateFrom ?? null,
    p_date_to: f.dateTo ?? null,
    p_teacher_id: f.teacherId ?? null,
    p_class_type_id: f.classTypeId ?? null,
  };
}

export async function getDashboardKpis(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<DashboardKpis | null> {
  const { data, error } = await supabase.rpc("get_dashboard_kpis", toRpcParams(filters));
  if (error) {
    console.error("get_dashboard_kpis", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    total_students: Number(row.total_students ?? 0),
    active_students: Number(row.active_students ?? 0),
    inactive_students: Number(row.inactive_students ?? 0),
    at_risk_students: Number(row.at_risk_students ?? 0),
    total_teachers: Number(row.total_teachers ?? 0),
    total_classes: Number(row.total_classes ?? 0),
    total_attendances: Number(row.total_attendances ?? 0),
    avg_attendances_per_class: Number(row.avg_attendances_per_class ?? 0),
    class_types_count: Number(row.class_types_count ?? 0),
    activity_rate: Number(row.activity_rate ?? 0),
  };
}

export async function getClassesByDay(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<DayCount[]> {
  const { data, error } = await supabase.rpc("get_classes_by_day", toRpcParams(filters));
  if (error) {
    console.error("get_classes_by_day", error);
    return [];
  }
  return (data ?? []).map((r: { day: string; count: number }) => ({
    day: r.day,
    count: Number(r.count ?? 0),
  }));
}

export async function getAttendanceByDay(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<DayCount[]> {
  const { data, error } = await supabase.rpc("get_attendance_by_day", toRpcParams(filters));
  if (error) {
    console.error("get_attendance_by_day", error);
    return [];
  }
  return (data ?? []).map((r: { day: string; count: number }) => ({
    day: r.day,
    count: Number(r.count ?? 0),
  }));
}

export async function getAttendanceByWeekday(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<WeekdayCount[]> {
  const { data, error } = await supabase.rpc("get_attendance_by_weekday", toRpcParams(filters));
  if (error) {
    console.error("get_attendance_by_weekday", error);
    return [];
  }
  return (data ?? []).map((r: { weekday: number; weekday_name: string; count: number }) => ({
    weekday: Number(r.weekday),
    weekday_name: String(r.weekday_name ?? ""),
    count: Number(r.count ?? 0),
  }));
}

export async function getAttendanceByTimeSlot(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<TimeSlotCount[]> {
  const { data, error } = await supabase.rpc("get_attendance_by_time_slot", toRpcParams(filters));
  if (error) {
    console.error("get_attendance_by_time_slot", error);
    return [];
  }
  return (data ?? []).map((r: { time_slot: string; count: number }) => ({
    time_slot: String(r.time_slot ?? "").slice(0, 5),
    count: Number(r.count ?? 0),
  }));
}

export async function getStudentsActivitySummary(
  supabase: SupabaseClient,
  dateFrom: string | null,
  dateTo: string | null
): Promise<StudentsActivityRow[]> {
  const { data, error } = await supabase.rpc("get_students_activity_summary", {
    p_date_from: dateFrom ?? null,
    p_date_to: dateTo ?? null,
  });
  if (error) {
    console.error("get_students_activity_summary", error);
    return [];
  }
  return (data ?? []).map((r: { status: string; count: number }) => ({
    status: String(r.status ?? ""),
    count: Number(r.count ?? 0),
  }));
}

export async function getNewStudentsByMonth(
  supabase: SupabaseClient,
  dateFrom: string | null,
  dateTo: string | null
): Promise<NewStudentsByMonth[]> {
  const { data, error } = await supabase.rpc("get_new_students_by_month", {
    p_date_from: dateFrom ?? null,
    p_date_to: dateTo ?? null,
  });
  if (error) {
    console.error("get_new_students_by_month", error);
    return [];
  }
  return (data ?? []).map((r: { month: string; count: number }) => ({
    month: r.month,
    count: Number(r.count ?? 0),
  }));
}

export async function getActiveStudentsEvolution(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<ActiveStudentsEvolutionRow[]> {
  const { data, error } = await supabase.rpc("get_active_students_evolution", toRpcParams(filters));
  if (error) {
    console.error("get_active_students_evolution", error);
    return [];
  }
  return (data ?? []).map((r: { day: string; active_count: number }) => ({
    day: r.day,
    active_count: Number(r.active_count ?? 0),
  }));
}

export async function getTeachersPerformanceSummary(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<TeacherPerformanceRow[]> {
  const { data, error } = await supabase.rpc("get_teachers_performance_summary", {
    p_period_id: filters.periodId ?? null,
    p_date_from: filters.dateFrom ?? null,
    p_date_to: filters.dateTo ?? null,
    p_class_type_id: filters.classTypeId ?? null,
  });
  if (error) {
    console.error("get_teachers_performance_summary", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    teacher_id: String(r.teacher_id ?? ""),
    teacher_name: String(r.teacher_name ?? ""),
    teacher_email: r.teacher_email != null ? String(r.teacher_email) : null,
    teacher_dni: r.teacher_dni != null ? String(r.teacher_dni) : null,
    teacher_phone: r.teacher_phone != null ? String(r.teacher_phone) : null,
    classes_count: Number(r.classes_count ?? 0),
    unique_students: Number(r.unique_students ?? 0),
    total_attendances: Number(r.total_attendances ?? 0),
    avg_per_class: Number(r.avg_per_class ?? 0),
    last_class_date: r.last_class_date ? String(r.last_class_date) : null,
  }));
}

export async function getStudentsByTeacher(
  supabase: SupabaseClient
): Promise<StudentsByTeacherRow[]> {
  const { data, error } = await supabase.rpc("get_students_by_teacher");
  if (error) {
    console.error("get_students_by_teacher", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    teacher_id: String(r.teacher_id ?? ""),
    teacher_name: String(r.teacher_name ?? ""),
    student_count: Number(r.student_count ?? 0),
  }));
}

export async function getClassTypePerformanceSummary(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<ClassTypePerformanceRow[]> {
  const { data, error } = await supabase.rpc("get_class_type_performance_summary", {
    p_period_id: filters.periodId ?? null,
    p_date_from: filters.dateFrom ?? null,
    p_date_to: filters.dateTo ?? null,
    p_teacher_id: filters.teacherId ?? null,
  });
  if (error) {
    console.error("get_class_type_performance_summary", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    class_type_id: String(r.class_type_id ?? ""),
    class_type_name: String(r.class_type_name ?? ""),
    classes_count: Number(r.classes_count ?? 0),
    total_attendances: Number(r.total_attendances ?? 0),
  }));
}

export async function getAttendanceByClassTypeOverTime(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<AttendanceByClassTypeOverTimeRow[]> {
  const { data, error } = await supabase.rpc("get_attendance_by_class_type_over_time", {
    p_period_id: filters.periodId ?? null,
    p_date_from: filters.dateFrom ?? null,
    p_date_to: filters.dateTo ?? null,
    p_teacher_id: filters.teacherId ?? null,
  });
  if (error) {
    console.error("get_attendance_by_class_type_over_time", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    day: String(r.day ?? ""),
    class_type_name: String(r.class_type_name ?? ""),
    count: Number(r.count ?? 0),
  }));
}

const cancellationRpcParams = (f: DashboardFilters) => ({
  p_period_id: f.periodId ?? null,
  p_date_from: f.dateFrom ?? null,
  p_date_to: f.dateTo ?? null,
  p_teacher_id: f.teacherId ?? null,
});

export async function getTopStudentsByCancellations(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<StudentCancellationRow[]> {
  const { data, error } = await supabase.rpc(
    "get_top_students_by_cancellations",
    cancellationRpcParams(filters)
  );
  if (error) {
    console.error("get_top_students_by_cancellations", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    student_id: String(r.student_id ?? ""),
    student_name: String(r.student_name ?? ""),
    cancellation_count: Number(r.cancellation_count ?? 0),
  }));
}

export async function getCancellationsByDay(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<DayCount[]> {
  const { data, error } = await supabase.rpc(
    "get_cancellations_by_day",
    cancellationRpcParams(filters)
  );
  if (error) {
    console.error("get_cancellations_by_day", error);
    return [];
  }
  return (data ?? []).map((r: { day: string; count: number }) => ({
    day: r.day,
    count: Number(r.count ?? 0),
  }));
}

export async function getCancellationsByWeekday(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<WeekdayCount[]> {
  const { data, error } = await supabase.rpc(
    "get_cancellations_by_weekday",
    cancellationRpcParams(filters)
  );
  if (error) {
    console.error("get_cancellations_by_weekday", error);
    return [];
  }
  return (data ?? []).map((r: { weekday: number; weekday_name: string; count: number }) => ({
    weekday: Number(r.weekday),
    weekday_name: String(r.weekday_name ?? ""),
    count: Number(r.count ?? 0),
  }));
}

export async function getCancellationsByTimeSlot(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<TimeSlotCount[]> {
  const { data, error } = await supabase.rpc(
    "get_cancellations_by_time_slot",
    cancellationRpcParams(filters)
  );
  if (error) {
    console.error("get_cancellations_by_time_slot", error);
    return [];
  }
  return (data ?? []).map((r: { time_slot: string; count: number }) => ({
    time_slot: String(r.time_slot ?? "").slice(0, 5),
    count: Number(r.count ?? 0),
  }));
}

export async function getTeachersCancellationsRanking(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<TeacherCancellationRow[]> {
  const { data, error } = await supabase.rpc(
    "get_teachers_cancellations_ranking",
    cancellationRpcParams(filters)
  );
  if (error) {
    console.error("get_teachers_cancellations_ranking", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    teacher_id: String(r.teacher_id ?? ""),
    teacher_name: String(r.teacher_name ?? ""),
    cancellation_count: Number(r.cancellation_count ?? 0),
  }));
}

export async function getCancellationKpis(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<CancellationKpisRow | null> {
  const { data, error } = await supabase.rpc(
    "get_cancellation_kpis",
    cancellationRpcParams(filters)
  );
  if (error) {
    console.error("get_cancellation_kpis", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    total_cancellations: Number(row.total_cancellations ?? 0),
    total_classes: Number(row.total_classes ?? 0),
    cancellation_rate_pct: Number(row.cancellation_rate_pct ?? 0),
    previous_period_cancellations: Number(row.previous_period_cancellations ?? 0),
    variation_pct: Number(row.variation_pct ?? 0),
    avg_per_teacher: Number(row.avg_per_teacher ?? 0),
    avg_per_student: Number(row.avg_per_student ?? 0),
  };
}

export async function getCancellationReasons(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<CancellationReasonRow[]> {
  const { data, error } = await supabase.rpc(
    "get_cancellation_reasons",
    cancellationRpcParams(filters)
  );
  if (error) {
    console.error("get_cancellation_reasons", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    reason_key: String(r.reason_key ?? ""),
    reason_label: String(r.reason_label ?? ""),
    count: Number(r.count ?? 0),
  }));
}

export async function getCancellationsByMonth(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<CancellationsByMonthRow[]> {
  const { data, error } = await supabase.rpc(
    "get_cancellations_by_month",
    cancellationRpcParams(filters)
  );
  if (error) {
    console.error("get_cancellations_by_month", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    period: String(r.period ?? ""),
    month_date: r.month_date ? String(r.month_date) : "",
    count: Number(r.count ?? 0),
  }));
}

export async function getCancellationsByTeacherOverTime(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<CancellationsByTeacherOverTimeRow[]> {
  const { data, error } = await supabase.rpc(
    "get_cancellations_by_teacher_over_time",
    cancellationRpcParams(filters)
  );
  if (error) {
    console.error("get_cancellations_by_teacher_over_time", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    period: String(r.period ?? ""),
    month_date: r.month_date ? String(r.month_date) : "",
    teacher_id: String(r.teacher_id ?? ""),
    teacher_name: String(r.teacher_name ?? ""),
    count: Number(r.count ?? 0),
  }));
}

export async function getIndividualVsSharedTotals(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<IndividualVsSharedTotalsRow | null> {
  const { data, error } = await supabase.rpc(
    "get_individual_vs_shared_totals",
    toRpcParams(filters)
  );
  if (error) {
    console.error("get_individual_vs_shared_totals", error);
    return null;
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    individual_total: Number(row.individual_total ?? 0),
    shared_total: Number(row.shared_total ?? 0),
  };
}

export async function getIndividualVsSharedOverTime(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<IndividualVsSharedOverTimeRow[]> {
  const { data, error } = await supabase.rpc(
    "get_individual_vs_shared_over_time",
    toRpcParams(filters)
  );
  if (error) {
    console.error("get_individual_vs_shared_over_time", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    period: String(r.period ?? ""),
    individual_count: Number(r.individual_count ?? 0),
    shared_count: Number(r.shared_count ?? 0),
  }));
}

export async function getIndividualVsSharedByTeacher(
  supabase: SupabaseClient,
  filters: DashboardFilters
): Promise<IndividualVsSharedByTeacherRow[]> {
  const { data, error } = await supabase.rpc(
    "get_individual_vs_shared_by_teacher",
    toRpcParams(filters)
  );
  if (error) {
    console.error("get_individual_vs_shared_by_teacher", error);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    teacher_id: String(r.teacher_id ?? ""),
    teacher_name: String(r.teacher_name ?? ""),
    individual_count: Number(r.individual_count ?? 0),
    shared_count: Number(r.shared_count ?? 0),
  }));
}

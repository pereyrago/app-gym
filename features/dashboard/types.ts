/** Filtros globales del dashboard (periodo, rango de fechas, profesor, tipo de clase). */
export type DashboardFilters = {
  periodId: string | null;
  dateFrom: string | null; // YYYY-MM-DD
  dateTo: string | null;
  teacherId: string | null;
  classTypeId: string | null;
};

/** Una fila de KPIs devuelta por get_dashboard_kpis. */
export type DashboardKpis = {
  total_students: number;
  active_students: number;
  inactive_students: number;
  at_risk_students: number;
  total_teachers: number;
  total_classes: number;
  total_attendances: number;
  avg_attendances_per_class: number;
  class_types_count: number;
  activity_rate: number;
};

/** Par para gráficos de líneas/barras por día. */
export type DayCount = { day: string; count: number };

/** Par día de semana / conteo. */
export type WeekdayCount = { weekday: number; weekday_name: string; count: number };

/** Par franja horaria / conteo. */
export type TimeSlotCount = { time_slot: string; count: number };

/** Status de alumno para donut activos/inactivos/riesgo. */
export type StudentsActivityRow = { status: string; count: number };

/** Nuevos alumnos por mes. */
export type NewStudentsByMonth = { month: string; count: number };

/** Evolución de alumnos activos por día. */
export type ActiveStudentsEvolutionRow = { day: string; active_count: number };

/** Ranking de profesores. */
export type TeacherPerformanceRow = {
  teacher_id: string;
  teacher_name: string;
  teacher_email: string | null;
  teacher_dni: string | null;
  teacher_phone: string | null;
  classes_count: number;
  unique_students: number;
  total_attendances: number;
  avg_per_class: number;
  last_class_date: string | null;
};

/** Alumnos por profesor (bar horizontal). */
export type StudentsByTeacherRow = {
  teacher_id: string;
  teacher_name: string;
  student_count: number;
};

/** Rendimiento por tipo de clase. */
export type ClassTypePerformanceRow = {
  class_type_id: string;
  class_type_name: string;
  classes_count: number;
  total_attendances: number;
};

/** Asistencia por tipo de clase en el tiempo (área apilada). */
export type AttendanceByClassTypeOverTimeRow = {
  day: string;
  class_type_name: string;
  count: number;
};

/** Alumno con más cancelaciones (faltas). */
export type StudentCancellationRow = {
  student_id: string;
  student_name: string;
  cancellation_count: number;
};

/** Profesor con más clases canceladas por él. */
export type TeacherCancellationRow = {
  teacher_id: string;
  teacher_name: string;
  cancellation_count: number;
};

/** Clases individuales vs grupales en el tiempo (por mes). */
export type IndividualVsSharedOverTimeRow = {
  period: string;
  individual_count: number;
  shared_count: number;
};

/** Clases individuales vs grupales por profesor. */
export type IndividualVsSharedByTeacherRow = {
  teacher_id: string;
  teacher_name: string;
  individual_count: number;
  shared_count: number;
};

/** KPIs de cancelaciones. */
export type CancellationKpisRow = {
  total_cancellations: number;
  total_classes: number;
  cancellation_rate_pct: number;
  previous_period_cancellations: number;
  variation_pct: number;
  avg_per_teacher: number;
  avg_per_student: number;
};

/** Motivo de cancelación con cantidad. */
export type CancellationReasonRow = {
  reason_key: string;
  reason_label: string;
  count: number;
};

/** Cancelaciones por mes (tendencia). */
export type CancellationsByMonthRow = {
  period: string;
  month_date: string;
  count: number;
};

/** Cancelaciones por profesor en el tiempo (multi-line). */
export type CancellationsByTeacherOverTimeRow = {
  period: string;
  month_date: string;
  teacher_id: string;
  teacher_name: string;
  count: number;
};

/** Totales individual vs grupal (distribución global). */
export type IndividualVsSharedTotalsRow = {
  individual_total: number;
  shared_total: number;
};

/** Opciones para llamar a las RPCs (filtros opcionales). */
export type DashboardRpcParams = {
  p_period_id?: string | null;
  p_date_from?: string | null;
  p_date_to?: string | null;
  p_teacher_id?: string | null;
  p_class_type_id?: string | null;
};

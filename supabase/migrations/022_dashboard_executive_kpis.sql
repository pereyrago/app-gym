-- =============================================================================
-- 022: Resumen Ejecutivo (Bloque 1 del Dashboard Ejecutivo)
-- =============================================================================
-- get_executive_summary_kpis devuelve, para el período filtrado, un trío
-- (actual / anterior / variación %) por métrica: alumnos activos, clases,
-- profesores, cancelaciones, horas trabajadas, % de asistencia y nuevos
-- alumnos. Satisfacción queda deliberadamente fuera (sin fuente de datos,
-- diferida a "segunda etapa" según el spec del cliente).
--
-- "Alumnos activos" acá es el conteo puro de asistentes distintos dentro del
-- período filtrado (sin el OR de "últimos 14 días" que sí usa
-- get_dashboard_kpis/get_students_activity_summary para evitar huecos en el
-- badge de Bloque 6) — para una comparación período-a-período tiene más
-- sentido de negocio comparar el mismo criterio en ambas ventanas.
--
-- El período anterior se calcula igual que en get_cancellation_kpis (015):
-- mismo largo de ventana, inmediatamente antes de p_date_from. Requiere
-- p_date_from y p_date_to no nulos; si falta alguno, el período anterior
-- queda vacío y las variaciones dan 0.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.pct_variation(p_current NUMERIC, p_previous NUMERIC)
RETURNS NUMERIC LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN COALESCE(p_previous, 0) > 0 THEN ROUND(((p_current - p_previous) / p_previous * 100), 1) ELSE 0 END;
$$;

CREATE OR REPLACE FUNCTION public.get_executive_summary_kpis(
  p_period_id UUID DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL,
  p_class_type_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL,
  p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (
  active_students_current BIGINT, active_students_previous BIGINT, active_students_variation_pct NUMERIC,
  classes_current BIGINT, classes_previous BIGINT, classes_variation_pct NUMERIC,
  teachers_current BIGINT, teachers_previous BIGINT, teachers_variation_pct NUMERIC,
  cancellations_current BIGINT, cancellations_previous BIGINT, cancellations_variation_pct NUMERIC,
  hours_current NUMERIC, hours_previous NUMERIC, hours_variation_pct NUMERIC,
  attendance_rate_current NUMERIC, attendance_rate_previous NUMERIC, attendance_rate_variation_pct NUMERIC,
  new_students_current BIGINT, new_students_previous BIGINT, new_students_variation_pct NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH prev_range AS (
    SELECT
      (p_date_from::date - (p_date_to::date - p_date_from::date + 1)) AS d_from,
      (p_date_from::date - 1) AS d_to
    WHERE p_date_from IS NOT NULL AND p_date_to IS NOT NULL
  ),
  cur_classes AS (
    SELECT c.id, c.teacher_id, c.class_date, c.status, c.duration_minutes FROM classes c
    WHERE (p_period_id IS NULL OR c.period_id = p_period_id)
      AND (p_date_from IS NULL OR c.class_date >= p_date_from)
      AND (p_date_to IS NULL OR c.class_date <= p_date_to)
      AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
      AND (p_student_id IS NULL OR EXISTS (
        SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
        UNION ALL
        SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
      ))
  ),
  prev_classes AS (
    SELECT c.id, c.teacher_id, c.class_date, c.status, c.duration_minutes FROM classes c, prev_range pr
    WHERE (p_period_id IS NULL OR c.period_id = p_period_id)
      AND c.class_date >= pr.d_from AND c.class_date <= pr.d_to
      AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
      AND (p_student_id IS NULL OR EXISTS (
        SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
        UNION ALL
        SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
      ))
  ),
  cur_agg AS (
    SELECT
      (SELECT COUNT(DISTINCT ca.student_id)::BIGINT FROM class_attendances ca WHERE EXISTS (SELECT 1 FROM cur_classes cc WHERE cc.id = ca.class_id)) AS active_students,
      (SELECT COUNT(*)::BIGINT FROM cur_classes) AS classes_count,
      (SELECT COUNT(DISTINCT teacher_id)::BIGINT FROM cur_classes) AS teachers_count,
      (SELECT COUNT(*)::BIGINT FROM cur_classes WHERE status = 'success') AS success_classes,
      (SELECT COUNT(*)::BIGINT FROM class_attendances ca WHERE EXISTS (SELECT 1 FROM cur_classes cc WHERE cc.id = ca.class_id)) AS attendances_count,
      (SELECT COALESCE(SUM(duration_minutes), 0)::NUMERIC / 60.0 FROM cur_classes WHERE status = 'success') AS hours,
      (
        (SELECT COUNT(*)::BIGINT FROM class_absences a JOIN cur_classes cc ON cc.id = a.class_id
          WHERE (p_student_id IS NULL OR a.student_id = p_student_id))
        +
        (SELECT COUNT(*)::BIGINT FROM cur_classes WHERE status = 'cancel_by_teacher')
      ) AS cancellations,
      (SELECT COUNT(*)::BIGINT FROM students s WHERE s.deleted_at IS NULL
        AND (p_teacher_id IS NULL OR s.teacher_id = p_teacher_id)
        AND (p_date_from IS NULL OR s.created_at::date >= p_date_from)
        AND (p_date_to IS NULL OR s.created_at::date <= p_date_to)) AS new_students
  ),
  prev_agg AS (
    SELECT
      (SELECT COUNT(DISTINCT ca.student_id)::BIGINT FROM class_attendances ca WHERE EXISTS (SELECT 1 FROM prev_classes cc WHERE cc.id = ca.class_id)) AS active_students,
      (SELECT COUNT(*)::BIGINT FROM prev_classes) AS classes_count,
      (SELECT COUNT(DISTINCT teacher_id)::BIGINT FROM prev_classes) AS teachers_count,
      (SELECT COUNT(*)::BIGINT FROM prev_classes WHERE status = 'success') AS success_classes,
      (SELECT COUNT(*)::BIGINT FROM class_attendances ca WHERE EXISTS (SELECT 1 FROM prev_classes cc WHERE cc.id = ca.class_id)) AS attendances_count,
      (SELECT COALESCE(SUM(duration_minutes), 0)::NUMERIC / 60.0 FROM prev_classes WHERE status = 'success') AS hours,
      (
        (SELECT COUNT(*)::BIGINT FROM class_absences a JOIN prev_classes cc ON cc.id = a.class_id
          WHERE (p_student_id IS NULL OR a.student_id = p_student_id))
        +
        (SELECT COUNT(*)::BIGINT FROM prev_classes WHERE status = 'cancel_by_teacher')
      ) AS cancellations,
      (SELECT COUNT(*)::BIGINT FROM students s, prev_range pr WHERE s.deleted_at IS NULL
        AND (p_teacher_id IS NULL OR s.teacher_id = p_teacher_id)
        AND s.created_at::date >= pr.d_from AND s.created_at::date <= pr.d_to) AS new_students
  ),
  agg AS (
    SELECT
      c.active_students AS ac, p.active_students AS ap,
      c.classes_count AS cc_, p.classes_count AS cp,
      c.teachers_count AS tc, p.teachers_count AS tp,
      c.cancellations AS canc_c, p.cancellations AS canc_p,
      c.hours AS hc, p.hours AS hp,
      CASE WHEN c.success_classes > 0 THEN ROUND((c.attendances_count::NUMERIC / c.success_classes * 100), 1) ELSE 0 END AS ar_c,
      CASE WHEN p.success_classes > 0 THEN ROUND((p.attendances_count::NUMERIC / p.success_classes * 100), 1) ELSE 0 END AS ar_p,
      c.new_students AS ns_c, p.new_students AS ns_p
    FROM cur_agg c CROSS JOIN prev_agg p
  )
  SELECT
    agg.ac, agg.ap, public.pct_variation(agg.ac, agg.ap),
    agg.cc_, agg.cp, public.pct_variation(agg.cc_, agg.cp),
    agg.tc, agg.tp, public.pct_variation(agg.tc, agg.tp),
    agg.canc_c, agg.canc_p, public.pct_variation(agg.canc_c, agg.canc_p),
    agg.hc, agg.hp, public.pct_variation(agg.hc, agg.hp),
    agg.ar_c, agg.ar_p, public.pct_variation(agg.ar_c, agg.ar_p),
    agg.ns_c, agg.ns_p, public.pct_variation(agg.ns_c, agg.ns_p)
  FROM agg;
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

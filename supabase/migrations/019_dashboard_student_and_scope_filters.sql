-- =============================================================================
-- 019: Filtros de "Alumno" y "Tipo de clase (Personalizado/Grupal)" en el dashboard
-- =============================================================================
-- Agrega p_student_id (UUID) y p_scope (public.class_scope: 'individual' | 'shared')
-- a las funciones RPC del dashboard. Ambos parámetros van al final con
-- DEFAULT NULL, por lo que las llamadas existentes (sin estos params) siguen
-- funcionando sin cambios.
--
-- Criterio de filtrado:
--   * p_scope filtra directamente por classes.scope, donde la función ya
--     referencia la tabla `classes` (alias `c`).
--   * p_student_id filtra:
--       - por `ca.student_id` cuando la función ya está unida a class_attendances,
--       - por `a.student_id` cuando ya está unida a class_absences,
--       - vía EXISTS combinado (class_attendances OR class_absences) cuando la
--         función solo referencia `classes` directamente, para capturar tanto
--         asistencias como faltas/cancelaciones de ese alumno.
--   * En get_individual_vs_shared_* y get_individual_vs_shared_totals NO se
--     agrega p_scope, porque esas funciones existen justamente para comparar
--     individual vs. grupal; filtrar por scope las volvería contradictorias.
--   * En get_dashboard_kpis, get_students_activity_summary, get_new_students_by_month
--     y get_students_by_teacher, total_students/active/inactive/at_risk quedan
--     como métricas globales (no tiene sentido de negocio filtrarlas por "un" alumno).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(
  p_period_id UUID DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL,
  p_class_type_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL,
  p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (
  total_students BIGINT, active_students BIGINT, inactive_students BIGINT, at_risk_students BIGINT,
  total_teachers BIGINT, total_classes BIGINT, total_attendances BIGINT, avg_attendances_per_class NUMERIC,
  class_types_count BIGINT, activity_rate NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH filtered_classes AS (
    SELECT c.id, c.teacher_id, c.class_date FROM classes c
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
  date_range AS (
    SELECT COALESCE(p_date_from, (SELECT MIN(class_date) FROM classes)) AS d_from,
           COALESCE(p_date_to, (SELECT MAX(class_date) FROM classes)) AS d_to
  ),
  last_15 AS (
    SELECT DISTINCT ca.student_id FROM class_attendances ca
    JOIN filtered_classes fc ON fc.id = ca.class_id
    JOIN date_range dr ON fc.class_date >= (dr.d_from - INTERVAL '15 days') AND fc.class_date <= dr.d_to
  ),
  last_30 AS (
    SELECT DISTINCT ca.student_id FROM class_attendances ca
    JOIN filtered_classes fc ON fc.id = ca.class_id
    JOIN date_range dr ON fc.class_date >= (dr.d_from - INTERVAL '30 days') AND fc.class_date <= dr.d_to
  ),
  inactive_set AS (SELECT s.id FROM students s WHERE s.deleted_at IS NULL EXCEPT SELECT student_id FROM last_15),
  at_risk_set AS (SELECT s.id FROM students s WHERE s.deleted_at IS NULL EXCEPT SELECT student_id FROM last_30),
  kpi AS (
    SELECT (SELECT COUNT(*)::BIGINT FROM students WHERE deleted_at IS NULL) AS total_students,
      (SELECT COUNT(*)::BIGINT FROM last_15) AS active_students,
      (SELECT COUNT(*)::BIGINT FROM inactive_set) AS inactive_students,
      (SELECT COUNT(*)::BIGINT FROM at_risk_set) AS at_risk_students,
      (SELECT COUNT(DISTINCT teacher_id)::BIGINT FROM filtered_classes) AS total_teachers,
      (SELECT COUNT(*)::BIGINT FROM filtered_classes) AS total_classes,
      (SELECT COUNT(*)::BIGINT FROM class_attendances ca WHERE EXISTS (SELECT 1 FROM filtered_classes fc WHERE fc.id = ca.class_id)) AS total_attendances,
      (SELECT COUNT(*)::BIGINT FROM class_types) AS class_types_count
  )
  SELECT k.total_students, k.active_students, k.inactive_students, k.at_risk_students,
    k.total_teachers, k.total_classes, k.total_attendances,
    CASE WHEN k.total_classes > 0 THEN (k.total_attendances::NUMERIC / k.total_classes) ELSE 0 END,
    k.class_types_count,
    CASE WHEN k.total_students > 0 THEN (k.active_students::NUMERIC / k.total_students * 100) ELSE 0 END
  FROM kpi k;
$$;

CREATE OR REPLACE FUNCTION public.get_classes_by_day(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (day DATE, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.class_date AS day, COUNT(*)::BIGINT FROM classes c
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
  GROUP BY c.class_date ORDER BY c.class_date;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_by_day(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (day DATE, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.class_date AS day, COUNT(ca.id)::BIGINT FROM class_attendances ca
  JOIN classes c ON c.id = ca.class_id
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id)
    AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to)
    AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
    AND (p_scope IS NULL OR c.scope = p_scope)
    AND (p_student_id IS NULL OR ca.student_id = p_student_id)
  GROUP BY c.class_date ORDER BY c.class_date;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_by_weekday(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (weekday INT, weekday_name TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH names AS (
    SELECT 0 AS d, 'Domingo' AS n UNION SELECT 1, 'Lunes' UNION SELECT 2, 'Martes' UNION SELECT 3, 'Miércoles'
    UNION SELECT 4, 'Jueves' UNION SELECT 5, 'Viernes' UNION SELECT 6, 'Sábado'
  )
  SELECT (EXTRACT(DOW FROM c.class_date::timestamp))::INT AS weekday, n.n AS weekday_name, COUNT(ca.id)::BIGINT
  FROM class_attendances ca JOIN classes c ON c.id = ca.class_id JOIN names n ON n.d = (EXTRACT(DOW FROM c.class_date::timestamp))::INT
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
    AND (p_scope IS NULL OR c.scope = p_scope)
    AND (p_student_id IS NULL OR ca.student_id = p_student_id)
  GROUP BY EXTRACT(DOW FROM c.class_date::timestamp), n.n ORDER BY weekday;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_by_time_slot(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (time_slot TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (c.start_time::TEXT)::TEXT AS time_slot, COUNT(ca.id)::BIGINT
  FROM class_attendances ca JOIN classes c ON c.id = ca.class_id
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
    AND (p_scope IS NULL OR c.scope = p_scope)
    AND (p_student_id IS NULL OR ca.student_id = p_student_id)
  GROUP BY c.start_time ORDER BY count DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_active_students_evolution(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (day DATE, active_count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH filtered_classes AS (
    SELECT c.id, c.class_date FROM classes c
    WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
      AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
  ),
  days AS (SELECT generate_series(COALESCE(p_date_from, (SELECT MIN(class_date) FROM classes)), COALESCE(p_date_to, (SELECT MAX(class_date) FROM classes)), '1 day'::interval)::date AS day)
  SELECT d.day, (SELECT COUNT(DISTINCT ca.student_id)::BIGINT FROM class_attendances ca JOIN filtered_classes fc ON fc.id = ca.class_id
    WHERE fc.class_date >= (d.day - INTERVAL '15 days') AND fc.class_date <= d.day
      AND (p_student_id IS NULL OR ca.student_id = p_student_id)) FROM days d ORDER BY d.day;
$$;

CREATE OR REPLACE FUNCTION public.get_teachers_performance_summary(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_class_type_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (
  teacher_id UUID, teacher_name TEXT, teacher_email TEXT, teacher_dni TEXT, teacher_phone TEXT,
  classes_count BIGINT, unique_students BIGINT, total_attendances BIGINT, avg_per_class NUMERIC, last_class_date DATE
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH filtered_classes AS (
    SELECT c.id, c.teacher_id, c.class_date FROM classes c
    WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
      AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
      AND (p_student_id IS NULL OR EXISTS (
        SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
        UNION ALL
        SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
      ))
  ),
  agg AS (
    SELECT fc.teacher_id, COUNT(DISTINCT fc.id)::BIGINT AS classes_count, COUNT(DISTINCT ca.student_id)::BIGINT AS unique_students,
      COUNT(ca.id)::BIGINT AS total_attendances, MAX(fc.class_date) AS last_class_date
    FROM filtered_classes fc LEFT JOIN class_attendances ca ON ca.class_id = fc.id GROUP BY fc.teacher_id
  )
  SELECT a.teacher_id, COALESCE(p.full_name, 'Sin nombre')::TEXT, p.email::TEXT, t.dni::TEXT, t.phone::TEXT,
    a.classes_count, a.unique_students, a.total_attendances,
    CASE WHEN a.classes_count > 0 THEN (a.total_attendances::NUMERIC / a.classes_count) ELSE 0 END, a.last_class_date
  FROM agg a JOIN teachers t ON t.id = a.teacher_id JOIN profiles p ON p.id = t.profile_id ORDER BY a.total_attendances DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_class_type_performance_summary(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (class_type_id UUID, class_type_name TEXT, classes_count BIGINT, total_attendances BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH filtered_classes AS (
    SELECT c.id, c.class_type_id, c.class_date FROM classes c
    WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
      AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
      AND (p_student_id IS NULL OR EXISTS (
        SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
        UNION ALL
        SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
      ))
  ),
  agg AS (SELECT fc.class_type_id, COUNT(DISTINCT fc.id)::BIGINT AS classes_count, COUNT(ca.id)::BIGINT AS total_attendances
    FROM filtered_classes fc LEFT JOIN class_attendances ca ON ca.class_id = fc.id GROUP BY fc.class_type_id)
  SELECT a.class_type_id, ct.name::TEXT, a.classes_count, a.total_attendances FROM agg a JOIN class_types ct ON ct.id = a.class_type_id ORDER BY a.total_attendances DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_by_class_type_over_time(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (day DATE, class_type_name TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.class_date AS day, ct.name::TEXT AS class_type_name, COUNT(ca.id)::BIGINT
  FROM class_attendances ca JOIN classes c ON c.id = ca.class_id JOIN class_types ct ON ct.id = c.class_type_id
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_scope IS NULL OR c.scope = p_scope)
    AND (p_student_id IS NULL OR ca.student_id = p_student_id)
  GROUP BY c.class_date, ct.id, ct.name ORDER BY c.class_date, ct.name;
$$;

CREATE OR REPLACE FUNCTION public.get_top_students_by_cancellations(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (student_id UUID, student_name TEXT, cancellation_count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id AS student_id, s.full_name AS student_name, COUNT(a.id)::BIGINT AS cancellation_count
  FROM class_absences a JOIN classes c ON c.id = a.class_id JOIN students s ON s.id = a.student_id AND s.deleted_at IS NULL
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_scope IS NULL OR c.scope = p_scope)
    AND (p_student_id IS NULL OR a.student_id = p_student_id)
  GROUP BY s.id, s.full_name ORDER BY cancellation_count DESC LIMIT 15;
$$;

CREATE OR REPLACE FUNCTION public.get_cancellations_by_day(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (day DATE, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.class_date AS day, COUNT(a.id)::BIGINT FROM class_absences a JOIN classes c ON c.id = a.class_id
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_scope IS NULL OR c.scope = p_scope)
    AND (p_student_id IS NULL OR a.student_id = p_student_id)
  GROUP BY c.class_date ORDER BY c.class_date;
$$;

CREATE OR REPLACE FUNCTION public.get_cancellations_by_weekday(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (weekday INT, weekday_name TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH names AS (SELECT 0 AS d, 'Domingo' AS n UNION SELECT 1, 'Lunes' UNION SELECT 2, 'Martes' UNION SELECT 3, 'Miércoles' UNION SELECT 4, 'Jueves' UNION SELECT 5, 'Viernes' UNION SELECT 6, 'Sábado')
  SELECT (EXTRACT(DOW FROM c.class_date::timestamp))::INT AS weekday, n.n AS weekday_name, COUNT(a.id)::BIGINT
  FROM class_absences a JOIN classes c ON c.id = a.class_id JOIN names n ON n.d = (EXTRACT(DOW FROM c.class_date::timestamp))::INT
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_scope IS NULL OR c.scope = p_scope)
    AND (p_student_id IS NULL OR a.student_id = p_student_id)
  GROUP BY EXTRACT(DOW FROM c.class_date::timestamp), n.n ORDER BY weekday;
$$;

CREATE OR REPLACE FUNCTION public.get_cancellations_by_time_slot(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (time_slot TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (c.start_time::TEXT)::TEXT AS time_slot, COUNT(a.id)::BIGINT FROM class_absences a JOIN classes c ON c.id = a.class_id
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_scope IS NULL OR c.scope = p_scope)
    AND (p_student_id IS NULL OR a.student_id = p_student_id)
  GROUP BY c.start_time ORDER BY count DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_teachers_cancellations_ranking(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (teacher_id UUID, teacher_name TEXT, cancellation_count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id AS teacher_id, COALESCE(p.full_name, 'Sin nombre')::TEXT AS teacher_name, COUNT(c.id)::BIGINT AS cancellation_count
  FROM classes c JOIN teachers t ON t.id = c.teacher_id LEFT JOIN profiles p ON p.id = t.profile_id
  WHERE c.status = 'cancel_by_teacher' AND (p_period_id IS NULL OR c.period_id = p_period_id)
    AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to)
    AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_scope IS NULL OR c.scope = p_scope)
    AND (p_student_id IS NULL OR EXISTS (
      SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
      UNION ALL
      SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
    ))
  GROUP BY t.id, p.full_name ORDER BY cancellation_count DESC LIMIT 15;
$$;

-- Nota: get_individual_vs_shared_* NO reciben p_scope a propósito (ver comentario arriba).
CREATE OR REPLACE FUNCTION public.get_individual_vs_shared_over_time(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL, p_student_id UUID DEFAULT NULL
)
RETURNS TABLE (period TEXT, individual_count BIGINT, shared_count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT to_char(c.class_date, 'YYYY-MM') AS period,
    COUNT(*) FILTER (WHERE COALESCE(c.scope, 'individual') = 'individual')::BIGINT AS individual_count,
    COUNT(*) FILTER (WHERE c.scope = 'shared')::BIGINT AS shared_count
  FROM classes c
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
    AND (p_student_id IS NULL OR EXISTS (
      SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
      UNION ALL
      SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
    ))
  GROUP BY to_char(c.class_date, 'YYYY-MM') ORDER BY period;
$$;

CREATE OR REPLACE FUNCTION public.get_individual_vs_shared_by_teacher(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL, p_student_id UUID DEFAULT NULL
)
RETURNS TABLE (teacher_id UUID, teacher_name TEXT, individual_count BIGINT, shared_count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id AS teacher_id, COALESCE(p.full_name, 'Sin nombre')::TEXT AS teacher_name,
    COUNT(*) FILTER (WHERE COALESCE(c.scope, 'individual') = 'individual')::BIGINT AS individual_count,
    COUNT(*) FILTER (WHERE c.scope = 'shared')::BIGINT AS shared_count
  FROM classes c JOIN teachers t ON t.id = c.teacher_id LEFT JOIN profiles p ON p.id = t.profile_id
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
    AND (p_student_id IS NULL OR EXISTS (
      SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
      UNION ALL
      SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
    ))
  GROUP BY t.id, p.full_name ORDER BY (COUNT(*) FILTER (WHERE COALESCE(c.scope, 'individual') = 'individual') + COUNT(*) FILTER (WHERE c.scope = 'shared')) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_individual_vs_shared_totals(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL, p_student_id UUID DEFAULT NULL
)
RETURNS TABLE (individual_total BIGINT, shared_total BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*) FILTER (WHERE COALESCE(c.scope, 'individual') = 'individual')::BIGINT, COUNT(*) FILTER (WHERE c.scope = 'shared')::BIGINT
  FROM classes c WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
    AND (p_student_id IS NULL OR EXISTS (
      SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
      UNION ALL
      SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
    ));
$$;

-- Cancelaciones extendidas: agregar p_student_id y p_scope
CREATE OR REPLACE FUNCTION public.get_cancellation_kpis(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (total_cancellations BIGINT, total_classes BIGINT, cancellation_rate_pct NUMERIC, previous_period_cancellations BIGINT, variation_pct NUMERIC, avg_per_teacher NUMERIC, avg_per_student NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT (SELECT COUNT(*)::BIGINT FROM class_absences a JOIN classes c ON c.id = a.class_id
        WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
          AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
          AND (p_scope IS NULL OR c.scope = p_scope) AND (p_student_id IS NULL OR a.student_id = p_student_id)) AS absences_count,
      (SELECT COUNT(*)::BIGINT FROM classes c
        WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
          AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
          AND c.status = 'cancel_by_teacher' AND (p_scope IS NULL OR c.scope = p_scope)
          AND (p_student_id IS NULL OR EXISTS (
            SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
            UNION ALL
            SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
          ))) AS teacher_cancel_count,
      (SELECT COUNT(*)::BIGINT FROM classes c
        WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
          AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
          AND (p_scope IS NULL OR c.scope = p_scope)
          AND (p_student_id IS NULL OR EXISTS (
            SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
            UNION ALL
            SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
          ))) AS total_classes,
      (SELECT COUNT(DISTINCT c.teacher_id)::BIGINT FROM classes c
        WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
          AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
          AND (p_scope IS NULL OR c.scope = p_scope)) AS num_teachers,
      (SELECT COUNT(DISTINCT a.student_id)::BIGINT FROM class_absences a JOIN classes c ON c.id = a.class_id
        WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
          AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
          AND (p_scope IS NULL OR c.scope = p_scope) AND (p_student_id IS NULL OR a.student_id = p_student_id)) AS students_with_absence
  ),
  prev_period AS (
    SELECT COUNT(*)::BIGINT AS prev_abs FROM class_absences a JOIN classes c ON c.id = a.class_id
    WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_scope IS NULL OR c.scope = p_scope) AND (p_student_id IS NULL OR a.student_id = p_student_id)
      AND p_date_from IS NOT NULL AND p_date_to IS NOT NULL
      AND c.class_date >= (p_date_from::date - (p_date_to::date - p_date_from::date + 1)) AND c.class_date < p_date_from::date
  ),
  prev_teacher AS (
    SELECT COUNT(*)::BIGINT AS prev_teacher_cancel FROM classes c
    WHERE c.status = 'cancel_by_teacher' AND (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
      AND (p_student_id IS NULL OR EXISTS (
        SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
        UNION ALL
        SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
      ))
      AND p_date_from IS NOT NULL AND p_date_to IS NOT NULL
      AND c.class_date >= (p_date_from::date - (p_date_to::date - p_date_from::date + 1)) AND c.class_date < p_date_from::date
  )
  SELECT b.absences_count + b.teacher_cancel_count, b.total_classes,
    CASE WHEN b.total_classes > 0 THEN ROUND(((b.absences_count + b.teacher_cancel_count)::NUMERIC / b.total_classes * 100), 1) ELSE 0 END,
    COALESCE(pp.prev_abs, 0) + COALESCE(pt.prev_teacher_cancel, 0),
    CASE WHEN (COALESCE(pp.prev_abs, 0) + COALESCE(pt.prev_teacher_cancel, 0)) > 0 THEN ROUND((((b.absences_count + b.teacher_cancel_count) - (COALESCE(pp.prev_abs, 0) + COALESCE(pt.prev_teacher_cancel, 0)))::NUMERIC / (COALESCE(pp.prev_abs, 0) + COALESCE(pt.prev_teacher_cancel, 0)) * 100), 1) ELSE 0 END,
    CASE WHEN b.num_teachers > 0 THEN ROUND(((b.absences_count + b.teacher_cancel_count)::NUMERIC / b.num_teachers), 1) ELSE 0 END,
    CASE WHEN b.students_with_absence > 0 THEN ROUND((b.absences_count::NUMERIC / b.students_with_absence), 1) ELSE 0 END
  FROM base b CROSS JOIN (SELECT COALESCE((SELECT prev_abs FROM prev_period), 0) AS prev_abs) pp CROSS JOIN (SELECT COALESCE((SELECT prev_teacher_cancel FROM prev_teacher), 0) AS prev_teacher_cancel) pt;
$$;

CREATE OR REPLACE FUNCTION public.get_cancellation_reasons(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (reason_key TEXT, reason_label TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH labels AS (SELECT 'viaje' AS k, 'Viaje' AS lbl UNION SELECT 'enfermedad', 'Enfermedad' UNION SELECT 'trabajo', 'Trabajo' UNION SELECT 'sin_aviso', 'Sin aviso' UNION SELECT 'otro', 'Otro')
  SELECT a.reason_type AS reason_key, l.lbl AS reason_label, COUNT(*)::BIGINT FROM class_absences a JOIN classes c ON c.id = a.class_id JOIN labels l ON l.k = a.reason_type
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_scope IS NULL OR c.scope = p_scope) AND (p_student_id IS NULL OR a.student_id = p_student_id)
  GROUP BY a.reason_type, l.lbl ORDER BY COUNT(*) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_cancellations_by_month(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (period TEXT, month_date DATE, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH abs_by_month AS (
    SELECT to_char(c.class_date, 'YYYY-MM') AS period, date_trunc('month', c.class_date::date)::date AS month_date, COUNT(a.id)::BIGINT AS cnt
    FROM class_absences a JOIN classes c ON c.id = a.class_id
    WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_scope IS NULL OR c.scope = p_scope) AND (p_student_id IS NULL OR a.student_id = p_student_id)
    GROUP BY to_char(c.class_date, 'YYYY-MM'), date_trunc('month', c.class_date::date)
  ),
  teacher_cancel_by_month AS (
    SELECT to_char(c.class_date, 'YYYY-MM') AS period, date_trunc('month', c.class_date::date)::date AS month_date, COUNT(*)::BIGINT AS cnt
    FROM classes c
    WHERE c.status = 'cancel_by_teacher' AND (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
      AND (p_student_id IS NULL OR EXISTS (
        SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
        UNION ALL
        SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
      ))
    GROUP BY to_char(c.class_date, 'YYYY-MM'), date_trunc('month', c.class_date::date)
  )
  SELECT COALESCE(a.period, t.period) AS period, COALESCE(a.month_date, t.month_date) AS month_date, (COALESCE(a.cnt, 0) + COALESCE(t.cnt, 0))::BIGINT AS count
  FROM abs_by_month a FULL OUTER JOIN teacher_cancel_by_month t ON a.period = t.period AND a.month_date = t.month_date ORDER BY COALESCE(a.month_date, t.month_date);
$$;

CREATE OR REPLACE FUNCTION public.get_cancellations_by_teacher_over_time(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (period TEXT, month_date DATE, teacher_id UUID, teacher_name TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH abs_by_teacher_month AS (
    SELECT to_char(c.class_date, 'YYYY-MM') AS period, date_trunc('month', c.class_date::date)::date AS month_date, t.id AS teacher_id, COALESCE(p.full_name, 'Sin nombre')::TEXT AS teacher_name, COUNT(a.id)::BIGINT AS cnt
    FROM class_absences a JOIN classes c ON c.id = a.class_id JOIN teachers t ON t.id = c.teacher_id LEFT JOIN profiles p ON p.id = t.profile_id
    WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_scope IS NULL OR c.scope = p_scope) AND (p_student_id IS NULL OR a.student_id = p_student_id)
    GROUP BY to_char(c.class_date, 'YYYY-MM'), date_trunc('month', c.class_date::date), t.id, p.full_name
  ),
  teacher_cancel_by_month AS (
    SELECT to_char(c.class_date, 'YYYY-MM') AS period, date_trunc('month', c.class_date::date)::date AS month_date, t.id AS teacher_id, COALESCE(p.full_name, 'Sin nombre')::TEXT AS teacher_name, COUNT(*)::BIGINT AS cnt
    FROM classes c JOIN teachers t ON t.id = c.teacher_id LEFT JOIN profiles p ON p.id = t.profile_id
    WHERE c.status = 'cancel_by_teacher' AND (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
      AND (p_student_id IS NULL OR EXISTS (
        SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
        UNION ALL
        SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
      ))
    GROUP BY to_char(c.class_date, 'YYYY-MM'), date_trunc('month', c.class_date::date), t.id, p.full_name
  )
  SELECT COALESCE(a.period, t.period) AS period, COALESCE(a.month_date, t.month_date) AS month_date, COALESCE(a.teacher_id, t.teacher_id) AS teacher_id, COALESCE(a.teacher_name, t.teacher_name) AS teacher_name, (COALESCE(a.cnt, 0) + COALESCE(t.cnt, 0))::BIGINT AS count
  FROM abs_by_teacher_month a FULL OUTER JOIN teacher_cancel_by_month t ON a.period = t.period AND a.month_date = t.month_date AND a.teacher_id = t.teacher_id ORDER BY COALESCE(a.month_date, t.month_date), (COALESCE(a.cnt, 0) + COALESCE(t.cnt, 0)) DESC;
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

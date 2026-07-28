-- =============================================================================
-- 023: Evolución del negocio unificada (Bloque 2 del Dashboard Ejecutivo)
-- =============================================================================
-- Una sola función devuelve, por día, las 5 series que el spec pide poder
-- alternar en un único gráfico: clases, horas, alumnos activos (asistentes
-- distintos ese día), nuevos alumnos y cancelaciones. Evita 5 round-trips
-- separados como tenía el dashboard legacy (classes-by-day, attendance-by-day,
-- etc. por separado).
--
-- "Alumnos activos" acá es "asistentes distintos ese día puntual" — distinto
-- de get_active_students_evolution (ventana rolling de 15 días) y del
-- "activo" período-completo de get_dashboard_kpis/get_executive_summary_kpis.
-- Es intencional: en un gráfico diario, la métrica más legible es "cuántos
-- alumnos distintos entrenaron ese día".
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_business_evolution_by_day(
  p_period_id UUID DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL,
  p_class_type_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL,
  p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (
  day DATE,
  classes_count BIGINT,
  hours NUMERIC,
  active_students_count BIGINT,
  new_students_count BIGINT,
  cancellations_count BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH filtered_classes AS (
    SELECT c.id, c.class_date, c.status, c.duration_minutes FROM classes c
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
  days AS (
    SELECT generate_series(
      COALESCE(p_date_from, (SELECT MIN(class_date) FROM classes)),
      COALESCE(p_date_to, (SELECT MAX(class_date) FROM classes)),
      '1 day'::interval
    )::date AS day
  ),
  classes_by_day AS (
    SELECT class_date AS day, COUNT(*)::BIGINT AS classes_count,
      (COALESCE(SUM(duration_minutes) FILTER (WHERE status = 'success'), 0)::NUMERIC / 60.0) AS hours
    FROM filtered_classes GROUP BY class_date
  ),
  active_by_day AS (
    SELECT fc.class_date AS day, COUNT(DISTINCT ca.student_id)::BIGINT AS active_students_count
    FROM class_attendances ca JOIN filtered_classes fc ON fc.id = ca.class_id
    GROUP BY fc.class_date
  ),
  new_students_by_day AS (
    SELECT s.created_at::date AS day, COUNT(*)::BIGINT AS new_students_count
    FROM students s
    WHERE s.deleted_at IS NULL
      AND (p_teacher_id IS NULL OR s.teacher_id = p_teacher_id)
      AND (p_date_from IS NULL OR s.created_at::date >= p_date_from)
      AND (p_date_to IS NULL OR s.created_at::date <= p_date_to)
    GROUP BY s.created_at::date
  ),
  cancellations_by_day AS (
    SELECT day, SUM(cnt)::BIGINT AS cancellations_count FROM (
      SELECT c.class_date AS day, COUNT(*) AS cnt
      FROM class_absences a JOIN filtered_classes c ON c.id = a.class_id
      WHERE (p_student_id IS NULL OR a.student_id = p_student_id)
      GROUP BY c.class_date
      UNION ALL
      SELECT class_date AS day, COUNT(*) AS cnt FROM filtered_classes WHERE status = 'cancel_by_teacher' GROUP BY class_date
    ) x GROUP BY day
  )
  SELECT
    d.day,
    COALESCE(cbd.classes_count, 0),
    COALESCE(cbd.hours, 0),
    COALESCE(abd.active_students_count, 0),
    COALESCE(nsd.new_students_count, 0),
    COALESCE(ccd.cancellations_count, 0)
  FROM days d
  LEFT JOIN classes_by_day cbd ON cbd.day = d.day
  LEFT JOIN active_by_day abd ON abd.day = d.day
  LEFT JOIN new_students_by_day nsd ON nsd.day = d.day
  LEFT JOIN cancellations_by_day ccd ON ccd.day = d.day
  ORDER BY d.day;
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

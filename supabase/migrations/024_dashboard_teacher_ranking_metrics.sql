-- =============================================================================
-- 024: Ranking de profesores unificado (Bloque 3 del Dashboard Ejecutivo)
-- =============================================================================
-- Nueva función, separada de get_teachers_performance_summary (015) para no
-- romper el widget legacy (teachers-ranking-table.tsx / teacher-performance-bars.tsx)
-- que depende de su forma de columnas actual. Agrega horas trabajadas,
-- cancelaciones (propias del profesor + faltas de sus alumnos) y % de
-- asistencia, para el gráfico switchable de Bloque 3
-- (Clases dadas / Horas / Alumnos / Cancelaciones / Asistencia).
-- No recibe p_teacher_id: es un ranking entre profesores, filtrar a "uno
-- solo" no tendría sentido de negocio (mismo criterio que la función 015).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_teacher_ranking_metrics(
  p_period_id UUID DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_class_type_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL,
  p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (
  teacher_id UUID,
  teacher_name TEXT,
  classes_count BIGINT,
  unique_students BIGINT,
  hours NUMERIC,
  cancellations_count BIGINT,
  attendance_pct NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH filtered_classes AS (
    SELECT c.id, c.teacher_id, c.class_date, c.status, c.duration_minutes FROM classes c
    WHERE (p_period_id IS NULL OR c.period_id = p_period_id)
      AND (p_date_from IS NULL OR c.class_date >= p_date_from)
      AND (p_date_to IS NULL OR c.class_date <= p_date_to)
      AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
      AND (p_student_id IS NULL OR EXISTS (
        SELECT 1 FROM class_attendances ca_f WHERE ca_f.class_id = c.id AND ca_f.student_id = p_student_id
        UNION ALL
        SELECT 1 FROM class_absences ab_f WHERE ab_f.class_id = c.id AND ab_f.student_id = p_student_id
      ))
  ),
  agg AS (
    SELECT fc.teacher_id,
      COUNT(DISTINCT fc.id)::BIGINT AS classes_count,
      COUNT(DISTINCT ca.student_id)::BIGINT AS unique_students,
      (COALESCE(SUM(fc.duration_minutes) FILTER (WHERE fc.status = 'success'), 0)::NUMERIC / 60.0) AS hours,
      COUNT(DISTINCT fc.id) FILTER (WHERE fc.status = 'success')::BIGINT AS success_classes,
      COUNT(ca.id)::BIGINT AS total_attendances
    FROM filtered_classes fc LEFT JOIN class_attendances ca ON ca.class_id = fc.id
    GROUP BY fc.teacher_id
  ),
  cancellations AS (
    SELECT teacher_id, SUM(cnt)::BIGINT AS cancellations_count FROM (
      SELECT fc.teacher_id, COUNT(*) AS cnt
      FROM class_absences a JOIN filtered_classes fc ON fc.id = a.class_id
      WHERE (p_student_id IS NULL OR a.student_id = p_student_id)
      GROUP BY fc.teacher_id
      UNION ALL
      SELECT teacher_id, COUNT(*) AS cnt FROM filtered_classes WHERE status = 'cancel_by_teacher' GROUP BY teacher_id
    ) x GROUP BY teacher_id
  )
  SELECT
    a.teacher_id,
    COALESCE(p.full_name, 'Sin nombre')::TEXT,
    a.classes_count,
    a.unique_students,
    a.hours,
    COALESCE(c.cancellations_count, 0),
    CASE WHEN a.success_classes > 0 THEN ROUND((a.total_attendances::NUMERIC / a.success_classes * 100), 1) ELSE 0 END
  FROM agg a
  JOIN teachers t ON t.id = a.teacher_id
  JOIN profiles p ON p.id = t.profile_id
  LEFT JOIN cancellations c ON c.teacher_id = a.teacher_id
  ORDER BY a.classes_count DESC;
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

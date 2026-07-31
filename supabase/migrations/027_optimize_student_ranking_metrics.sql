-- =============================================================================
-- 027: Optimiza get_student_ranking_metrics sin cambiar semántica
-- =============================================================================
-- Misma semántica que 026:
--   - classes_count / cancellations_count acotados por p_date_from/p_date_to
--   - last_class_date SIN restricción de fechas (sí respeta teacher/scope/type)
--   - base = todos los alumnos no borrados (filtrados por p_teacher_id)
--
-- Cambios de plan:
--   1) Partir de student_base (menos filas cuando hay p_teacher_id)
--   2) Restringir agregaciones a alumnos del roster (JOIN student_base)
--   3) Join directo a classes (evita CTE intermedia de todos los IDs)
--   4) Índice de soporte para filtros frecuentes en classes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_classes_teacher_scope_date
  ON public.classes (teacher_id, scope, class_date);

CREATE OR REPLACE FUNCTION public.get_student_ranking_metrics(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL,
  p_class_type_id UUID DEFAULT NULL,
  p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (
  student_id UUID,
  student_name TEXT,
  classes_count BIGINT,
  cancellations_count BIGINT,
  last_class_date DATE,
  created_at DATE
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH student_base AS (
    SELECT s.id, s.full_name, s.created_at
    FROM students s
    WHERE s.deleted_at IS NULL
      AND (p_teacher_id IS NULL OR s.teacher_id = p_teacher_id)
  ),
  period_attendance AS (
    SELECT ca.student_id, COUNT(DISTINCT ca.class_id)::BIGINT AS classes_count
    FROM class_attendances ca
    INNER JOIN student_base sb ON sb.id = ca.student_id
    INNER JOIN classes c ON c.id = ca.class_id
    WHERE (p_date_from IS NULL OR c.class_date >= p_date_from)
      AND (p_date_to IS NULL OR c.class_date <= p_date_to)
      AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
    GROUP BY ca.student_id
  ),
  period_cancellations AS (
    SELECT a.student_id, COUNT(*)::BIGINT AS cancellations_count
    FROM class_absences a
    INNER JOIN student_base sb ON sb.id = a.student_id
    INNER JOIN classes c ON c.id = a.class_id
    WHERE (p_date_from IS NULL OR c.class_date >= p_date_from)
      AND (p_date_to IS NULL OR c.class_date <= p_date_to)
      AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
    GROUP BY a.student_id
  ),
  last_attendance AS (
    SELECT ca.student_id, MAX(c.class_date) AS last_class_date
    FROM class_attendances ca
    INNER JOIN student_base sb ON sb.id = ca.student_id
    INNER JOIN classes c ON c.id = ca.class_id
    WHERE (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
    GROUP BY ca.student_id
  )
  SELECT
    sb.id,
    sb.full_name::TEXT,
    COALESCE(pa.classes_count, 0),
    COALESCE(pca.cancellations_count, 0),
    la.last_class_date,
    sb.created_at::DATE
  FROM student_base sb
  LEFT JOIN last_attendance la ON la.student_id = sb.id
  LEFT JOIN period_attendance pa ON pa.student_id = sb.id
  LEFT JOIN period_cancellations pca ON pca.student_id = sb.id
  ORDER BY COALESCE(pa.classes_count, 0) DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_ranking_metrics(
  DATE, DATE, UUID, UUID, public.class_scope
) TO anon, authenticated, service_role;

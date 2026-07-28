-- =============================================================================
-- 025: Cancelaciones por quién (Bloque 5 del Dashboard Ejecutivo)
-- =============================================================================
-- Nueva función para la dona "Cancelaciones" del spec (Alumno / Profesor /
-- Clima / Otros). Categoriza cada cancelación según su origen:
--   - reason_type / cancellation_reason_type = 'clima' en cualquiera de los
--     dos lados (falta de alumno o cancelación de profesor) -> 'clima',
--     gana primero porque el clima es transversal a ambos orígenes.
--   - Resto de las filas de class_absences -> 'alumno'.
--   - Resto de las clases con status = 'cancel_by_teacher' -> 'profesor'.
-- No existe una categoría 'otros' alcanzable desde este modelo: toda
-- cancelación es una falta de alumno o una clase cancelada por el profesor.
-- El front sintetiza una porción "Otros" en 0 para completar la dona de 4
-- categorías del spec, en vez de forzar una rama SQL muerta acá.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_cancellations_by_source(
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL,
  p_class_type_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL,
  p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (
  source TEXT,
  count BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH filtered_classes AS (
    SELECT c.id, c.status, c.cancellation_reason_type FROM classes c
    WHERE (p_date_from IS NULL OR c.class_date >= p_date_from)
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
  sourced AS (
    SELECT CASE WHEN a.reason_type = 'clima' THEN 'clima' ELSE 'alumno' END AS source
    FROM class_absences a
    JOIN filtered_classes fc ON fc.id = a.class_id
    WHERE (p_student_id IS NULL OR a.student_id = p_student_id)
    UNION ALL
    SELECT CASE WHEN fc.cancellation_reason_type = 'clima' THEN 'clima' ELSE 'profesor' END AS source
    FROM filtered_classes fc
    WHERE fc.status = 'cancel_by_teacher'
  )
  SELECT source, COUNT(*)::BIGINT AS count
  FROM sourced
  GROUP BY source;
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

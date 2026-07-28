-- =============================================================================
-- 020: Agrega "clima" como motivo de cancelación
-- =============================================================================
-- Permite registrar faltas de alumno (class_absences.reason_type) con motivo
-- "clima" (ej. lluvia, corte de luz por tormenta). El lado profesor
-- (classes.cancellation_reason_type) ya es TEXT libre, no requiere migración
-- de constraint, solo el nuevo valor en la UI y en get_cancellation_reasons.
-- =============================================================================

ALTER TABLE public.class_absences DROP CONSTRAINT class_absences_reason_type_check;
ALTER TABLE public.class_absences ADD CONSTRAINT class_absences_reason_type_check
  CHECK (reason_type IN ('viaje', 'enfermedad', 'trabajo', 'sin_aviso', 'otro', 'clima'));

CREATE OR REPLACE FUNCTION public.get_cancellation_reasons(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL,
  p_student_id UUID DEFAULT NULL, p_scope public.class_scope DEFAULT NULL
)
RETURNS TABLE (reason_key TEXT, reason_label TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH labels AS (
    SELECT 'viaje' AS k, 'Viaje' AS lbl UNION SELECT 'enfermedad', 'Enfermedad' UNION SELECT 'trabajo', 'Trabajo'
    UNION SELECT 'sin_aviso', 'Sin aviso' UNION SELECT 'clima', 'Clima' UNION SELECT 'otro', 'Otro'
  )
  SELECT a.reason_type AS reason_key, l.lbl AS reason_label, COUNT(*)::BIGINT FROM class_absences a JOIN classes c ON c.id = a.class_id JOIN labels l ON l.k = a.reason_type
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_scope IS NULL OR c.scope = p_scope) AND (p_student_id IS NULL OR a.student_id = p_student_id)
  GROUP BY a.reason_type, l.lbl ORDER BY COUNT(*) DESC;
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

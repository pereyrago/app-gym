-- =============================================================================
-- 026: Ranking de alumnos (Bloque 7 del Dashboard Ejecutivo)
-- =============================================================================
-- Nueva función, misma lógica que get_teacher_ranking_metrics (024) pero
-- para alumnos. No recibe p_student_id: es un ranking entre alumnos,
-- filtrar a "uno solo" no tendría sentido de negocio.
--
-- classes_count / cancellations_count están acotados por p_date_from/
-- p_date_to (actividad "en el período"), pero last_class_date NO -- se
-- calcula sobre la última clase real del alumno sin restricción de fecha
-- (respetando el resto de los filtros), mismo criterio que la
-- clasificación activo/en riesgo/inactivo de la migración 021. Si
-- last_class_date estuviera acotado por el rango de fechas, el sort "más
-- tiempo sin asistir" perdería sentido para alumnos que no entrenaron en
-- absoluto dentro del período filtrado.
--
-- cancellations_count sólo cuenta class_absences (faltas del alumno). No
-- existe una tabla de "inscripción/roster" que permita atribuir una clase
-- cancelada por el profesor (status = 'cancel_by_teacher') a alumnos
-- puntuales, a diferencia de get_teacher_ranking_metrics que sí puede
-- sumar esas cancelaciones al lado del profesor. Esto es intencional y
-- distinto del criterio a nivel profesor.
--
-- La base es la tabla students (no deleted_at), no las clases filtradas:
-- así los alumnos sin actividad en el período igual aparecen (con 0 en
-- clases_count/cancelaciones y last_class_date NULL), necesario para poder
-- ordenar por "más tiempo sin asistir". p_teacher_id filtra tanto las
-- clases contempladas como el roster (students.teacher_id), ya que acá
-- corresponde acotar a "los alumnos de ese profesor".
-- =============================================================================

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
  WITH scope_classes AS (
    SELECT c.id, c.class_date FROM classes c
    WHERE (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
  ),
  period_classes AS (
    SELECT id, class_date FROM scope_classes
    WHERE (p_date_from IS NULL OR class_date >= p_date_from)
      AND (p_date_to IS NULL OR class_date <= p_date_to)
  ),
  last_attendance AS (
    SELECT ca.student_id, MAX(sc.class_date) AS last_class_date
    FROM class_attendances ca JOIN scope_classes sc ON sc.id = ca.class_id
    GROUP BY ca.student_id
  ),
  period_attendance AS (
    SELECT ca.student_id, COUNT(DISTINCT ca.class_id)::BIGINT AS classes_count
    FROM class_attendances ca JOIN period_classes pc ON pc.id = ca.class_id
    GROUP BY ca.student_id
  ),
  period_cancellations AS (
    SELECT a.student_id, COUNT(*)::BIGINT AS cancellations_count
    FROM class_absences a JOIN period_classes pc ON pc.id = a.class_id
    GROUP BY a.student_id
  )
  SELECT
    s.id,
    s.full_name::TEXT,
    COALESCE(pa.classes_count, 0),
    COALESCE(pca.cancellations_count, 0),
    la.last_class_date,
    s.created_at::DATE
  FROM students s
  LEFT JOIN last_attendance la ON la.student_id = s.id
  LEFT JOIN period_attendance pa ON pa.student_id = s.id
  LEFT JOIN period_cancellations pca ON pca.student_id = s.id
  WHERE s.deleted_at IS NULL
    AND (p_teacher_id IS NULL OR s.teacher_id = p_teacher_id)
  ORDER BY COALESCE(pa.classes_count, 0) DESC;
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

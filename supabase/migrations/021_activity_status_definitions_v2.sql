-- =============================================================================
-- 021: Redefine activo/en riesgo/inactivo según el spec del Dashboard Ejecutivo
-- =============================================================================
-- Definiciones anteriores (migraciones 007/019): activo = asistió en los últimos
-- 15 días (relativos al rango de fechas filtrado); en riesgo = no asistió en los
-- últimos 30 días; sin nivel "inactivo" separado (era el complemento de "activo").
--
-- Definiciones nuevas (spec cliente, Dashboard.pdf):
--   Activo:    entrenó durante el período seleccionado, o su última clase (sin
--              restricción de fecha, respetando los demás filtros) fue hace
--              14 días o menos. El OR con "últimos 14 días" evita que un alumno
--              que entrena con normalidad pero no dentro de una ventana de
--              filtro angosta (ej. "Hoy") quede fuera de las tres categorías.
--   En riesgo: no entrena hace más de 14 días (y 30 o menos).
--   Inactivo:  no entrena hace más de 30 días, o nunca entrenó.
--
-- IMPORTANTE: este cambio modifica números ya visibles en el dashboard actual
-- (at_risk_students pasa de un corte de 30 días a 14 días; active_students deja
-- de ser una ventana fija de 15 días y pasa a ser período-relativa). Ver el
-- audit de "ripple" en el PR: components/dashboard/dashboard-tabs-content.tsx,
-- components/dashboard/business-insights.tsx, features/dashboard/constants.ts,
-- docs/dashboard-admin.md.
--
-- get_active_students_evolution NO se toca acá a propósito: es una tendencia
-- día a día (ventana rolling de 15 días), no un snapshot de nivel; mezclarla
-- con los umbrales 14/30 cambiaría la forma del gráfico de "Evolución de
-- alumnos activos" sin que el spec lo haya pedido explícitamente.
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
  period_attendees AS (
    SELECT DISTINCT ca.student_id FROM class_attendances ca
    JOIN filtered_classes fc ON fc.id = ca.class_id
  ),
  last_attendance AS (
    SELECT ca.student_id, MAX(c.class_date) AS last_date
    FROM class_attendances ca JOIN classes c ON c.id = ca.class_id
    WHERE (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
      AND (p_scope IS NULL OR c.scope = p_scope)
      AND (p_student_id IS NULL OR ca.student_id = p_student_id)
    GROUP BY ca.student_id
  ),
  recent_attendees AS (
    SELECT student_id FROM last_attendance WHERE (CURRENT_DATE - last_date) <= 14
  ),
  active_set AS (
    SELECT student_id FROM period_attendees
    UNION
    SELECT student_id FROM recent_attendees
  ),
  base_students AS (SELECT id FROM students WHERE deleted_at IS NULL),
  at_risk_set AS (
    SELECT bs.id FROM base_students bs
    JOIN last_attendance la ON la.student_id = bs.id
    WHERE bs.id NOT IN (SELECT student_id FROM active_set)
      AND (CURRENT_DATE - la.last_date) > 14 AND (CURRENT_DATE - la.last_date) <= 30
  ),
  inactive_set AS (
    SELECT bs.id FROM base_students bs
    LEFT JOIN last_attendance la ON la.student_id = bs.id
    WHERE bs.id NOT IN (SELECT student_id FROM active_set)
      AND (la.last_date IS NULL OR (CURRENT_DATE - la.last_date) > 30)
  ),
  kpi AS (
    SELECT (SELECT COUNT(*)::BIGINT FROM students WHERE deleted_at IS NULL) AS total_students,
      (SELECT COUNT(*)::BIGINT FROM active_set) AS active_students,
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

CREATE OR REPLACE FUNCTION public.get_students_activity_summary(p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL)
RETURNS TABLE (status TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH period_attendees AS (
    SELECT DISTINCT ca.student_id FROM class_attendances ca JOIN classes c ON c.id = ca.class_id
    WHERE (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to)
  ),
  last_attendance AS (
    SELECT ca.student_id, MAX(c.class_date) AS last_date
    FROM class_attendances ca JOIN classes c ON c.id = ca.class_id
    GROUP BY ca.student_id
  ),
  recent_attendees AS (
    SELECT student_id FROM last_attendance WHERE (CURRENT_DATE - last_date) <= 14
  ),
  active_set AS (
    SELECT student_id FROM period_attendees
    UNION
    SELECT student_id FROM recent_attendees
  ),
  base_students AS (SELECT id FROM students WHERE deleted_at IS NULL),
  at_risk_set AS (
    SELECT bs.id FROM base_students bs
    JOIN last_attendance la ON la.student_id = bs.id
    WHERE bs.id NOT IN (SELECT student_id FROM active_set)
      AND (CURRENT_DATE - la.last_date) > 14 AND (CURRENT_DATE - la.last_date) <= 30
  ),
  inactive_set AS (
    SELECT bs.id FROM base_students bs
    LEFT JOIN last_attendance la ON la.student_id = bs.id
    WHERE bs.id NOT IN (SELECT student_id FROM active_set)
      AND (la.last_date IS NULL OR (CURRENT_DATE - la.last_date) > 30)
  )
  SELECT 'active' AS status, (SELECT COUNT(*)::BIGINT FROM active_set) AS count
  UNION ALL SELECT 'at_risk', (SELECT COUNT(*)::BIGINT FROM at_risk_set)
  UNION ALL SELECT 'inactive', (SELECT COUNT(*)::BIGINT FROM inactive_set);
$$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

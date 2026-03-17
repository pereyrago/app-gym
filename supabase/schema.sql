-- =============================================================================
-- Schema único para app-gym (base limpia). Generado desde migraciones 001-015.
-- Ejecutar sobre una base vacía (o después de DROP/CREATE).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos
CREATE TYPE app_role AS ENUM ('admin', 'profesor');
CREATE TYPE public.class_status AS ENUM ('success', 'cancel_by_student', 'cancel_by_teacher');
CREATE TYPE public.class_scope AS ENUM ('individual', 'shared');

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'profesor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- teachers (profile_id, public_slug, dni, phone)
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  public_slug TEXT NOT NULL UNIQUE,
  dni TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_teachers_profile_id ON public.teachers(profile_id);
CREATE UNIQUE INDEX idx_teachers_public_slug ON public.teachers(public_slug);

-- periods
CREATE TABLE public.periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT periods_dates_check CHECK (end_date >= start_date)
);
CREATE INDEX idx_periods_dates ON public.periods(start_date, end_date);

-- class_types (antes de classes)
CREATE TABLE public.class_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_class_types_name ON public.class_types(name);

-- students (con status, deleted_at, dni, phone, emergency_contact_phone, apto_fisico)
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'to_confirm', 'rejected')),
  deleted_at TIMESTAMPTZ NULL,
  dni TEXT NULL,
  phone TEXT NULL,
  emergency_contact_phone TEXT NULL,
  apto_fisico BOOLEAN NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_students_teacher_id ON public.students(teacher_id);
CREATE UNIQUE INDEX idx_students_teacher_dni ON public.students(teacher_id, dni) WHERE dni IS NOT NULL;
CREATE INDEX idx_students_teacher_status ON public.students(teacher_id, status);
CREATE INDEX idx_students_teacher_full_name ON public.students(teacher_id, full_name);
CREATE INDEX idx_students_deleted_at ON public.students(teacher_id, deleted_at);

-- classes (sin title; class_type_id, start_time, duration_minutes, status, scope, cancellation_*)
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE RESTRICT,
  class_type_id UUID NOT NULL REFERENCES public.class_types(id) ON DELETE RESTRICT,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00',
  duration_minutes INT NOT NULL DEFAULT 60,
  status public.class_status NOT NULL DEFAULT 'success',
  cancellation_reason TEXT,
  cancellation_reason_type TEXT,
  cancellation_reason_other TEXT,
  cancellation_reason_observations TEXT,
  scope public.class_scope NOT NULL DEFAULT 'individual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT classes_cancellation_reason_required CHECK (
    (status = 'success' AND cancellation_reason IS NULL)
    OR (status IN ('cancel_by_student', 'cancel_by_teacher') AND cancellation_reason IS NOT NULL AND cancellation_reason <> '')
  )
);
CREATE INDEX idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX idx_classes_period_id ON public.classes(period_id);
CREATE INDEX idx_classes_created_at ON public.classes(created_at);

-- class_attendances
CREATE TABLE public.class_attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);
CREATE INDEX idx_class_attendances_class_id ON public.class_attendances(class_id);
CREATE INDEX idx_class_attendances_student_id ON public.class_attendances(student_id);

-- class_absences
CREATE TABLE public.class_absences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reason_type TEXT NOT NULL CHECK (reason_type IN ('viaje', 'enfermedad', 'trabajo', 'sin_aviso', 'otro')),
  reason_other TEXT,
  observations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);
CREATE INDEX idx_class_absences_class_id ON public.class_absences(class_id);
CREATE INDEX idx_class_absences_student_id ON public.class_absences(student_id);

-- student_shares (alumnos compartidos entre profesores)
CREATE TABLE public.student_shares (
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (teacher_id, student_id)
);
CREATE INDEX idx_student_shares_teacher_id ON public.student_shares(teacher_id);
CREATE INDEX idx_student_shares_student_id ON public.student_shares(student_id);

-- Funciones de rol y helpers
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role')::app_role, (SELECT role FROM public.profiles WHERE id = auth.uid())); $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.get_user_role() = 'admin'; $$;

CREATE OR REPLACE FUNCTION public.get_my_teacher_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT t.id FROM public.teachers t JOIN public.profiles p ON p.id = t.profile_id WHERE p.id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Edición de clase hasta 24h después del inicio (por fecha/hora de la clase)
CREATE OR REPLACE FUNCTION public.class_can_edit(p_class_date DATE, p_start_time TIME)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT now() <= ((p_class_date + p_start_time) AT TIME ZONE 'America/Argentina/Buenos_Aires') + interval '24 hours';
$$;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_shares ENABLE ROW LEVEL SECURITY;

-- Policies: profiles (publishable key + JWT: usuario ve/actualiza/inserta solo el propio)
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Users can update own profile (limited)" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Policies: teachers (anon puede leer por public_slug para formularios públicos)
CREATE POLICY "Admins can do all on teachers" ON public.teachers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teachers can view own row" ON public.teachers FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "Public can read teachers with slug" ON public.teachers FOR SELECT TO anon USING (public_slug IS NOT NULL AND public_slug <> '');

-- Policies: periods
CREATE POLICY "Admins can do all on periods" ON public.periods FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Authenticated can read periods" ON public.periods FOR SELECT TO authenticated USING (true);

-- Policies: class_types
CREATE POLICY "Admins can do all on class_types" ON public.class_types FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Authenticated can read class_types" ON public.class_types FOR SELECT TO authenticated USING (true);

-- Policies: students (anon puede insertar alumno nuevo vía formulario público del profesor con slug)
CREATE POLICY "Teachers can manage own students" ON public.students FOR ALL
  USING (teacher_id = public.get_my_teacher_id()) WITH CHECK (teacher_id = public.get_my_teacher_id());
CREATE POLICY "Admins can view all students" ON public.students FOR SELECT USING (public.is_admin());
CREATE POLICY "Public can read students of teachers with slug" ON public.students FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = students.teacher_id AND t.public_slug IS NOT NULL AND t.public_slug <> ''));
CREATE POLICY "Public can insert student for teacher with slug" ON public.students FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = students.teacher_id AND t.public_slug IS NOT NULL AND t.public_slug <> ''));

-- Policies: classes (24h desde inicio de clase)
CREATE POLICY "Teachers can select own classes" ON public.classes FOR SELECT USING (teacher_id = public.get_my_teacher_id());
CREATE POLICY "Teachers can insert own classes" ON public.classes FOR INSERT WITH CHECK (teacher_id = public.get_my_teacher_id());
CREATE POLICY "Teachers can update own classes within 24h" ON public.classes FOR UPDATE
  USING (teacher_id = public.get_my_teacher_id() AND public.class_can_edit(class_date, start_time))
  WITH CHECK (teacher_id = public.get_my_teacher_id());
CREATE POLICY "Teachers can delete own classes within 24h" ON public.classes FOR DELETE
  USING (teacher_id = public.get_my_teacher_id() AND public.class_can_edit(class_date, start_time));
CREATE POLICY "Admins can view all classes" ON public.classes FOR SELECT USING (public.is_admin());
CREATE POLICY "Public can read classes of teachers with slug" ON public.classes FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = classes.teacher_id AND t.public_slug IS NOT NULL AND t.public_slug <> ''));
CREATE POLICY "Admins can insert classes for any teacher" ON public.classes FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update classes within 24h" ON public.classes FOR UPDATE
  USING (public.is_admin() AND public.class_can_edit(class_date, start_time)) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete classes within 24h" ON public.classes FOR DELETE
  USING (public.is_admin() AND public.class_can_edit(class_date, start_time));

-- Policies: class_attendances (anon puede insertar asistencia para clases de profes con slug)
CREATE POLICY "Teachers can manage attendances for own classes" ON public.class_attendances FOR ALL
  USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_attendances.class_id AND c.teacher_id = public.get_my_teacher_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_attendances.class_id AND c.teacher_id = public.get_my_teacher_id()));
CREATE POLICY "Admins can view all attendances" ON public.class_attendances FOR SELECT USING (public.is_admin());
CREATE POLICY "Public can insert attendance for class of teacher with slug" ON public.class_attendances FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes c JOIN public.teachers t ON t.id = c.teacher_id WHERE c.id = class_attendances.class_id AND t.public_slug IS NOT NULL AND t.public_slug <> ''));

-- Policies: class_absences
CREATE POLICY "Teachers can manage absences for own classes" ON public.class_absences FOR ALL
  USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_absences.class_id AND c.teacher_id = public.get_my_teacher_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_absences.class_id AND c.teacher_id = public.get_my_teacher_id()));
CREATE POLICY "Admins can view all absences" ON public.class_absences FOR SELECT USING (public.is_admin());

-- Policies: student_shares
CREATE POLICY "Admins can manage student shares" ON public.student_shares FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Teachers can read their shared students" ON public.student_shares FOR SELECT
  USING (teacher_id = public.get_my_teacher_id());

-- Helpers: alumnos visibles por profesor (propios + compartidos)
CREATE OR REPLACE FUNCTION public.teacher_can_use_student(p_teacher_id UUID, p_student_id UUID)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = p_student_id AND s.deleted_at IS NULL
      AND (
        s.teacher_id = p_teacher_id
        OR EXISTS (SELECT 1 FROM student_shares ss WHERE ss.teacher_id = p_teacher_id AND ss.student_id = s.id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_students_for_teacher(
  p_teacher_id UUID,
  p_search TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'full_name',
  p_sort_order TEXT DEFAULT 'asc',
  p_limit INT DEFAULT NULL
)
RETURNS SETOF public.students
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sort_by TEXT := CASE WHEN p_sort_by IN ('full_name', 'status') THEN p_sort_by ELSE 'full_name' END;
  v_sort_order TEXT := CASE WHEN lower(p_sort_order) IN ('asc', 'desc') THEN lower(p_sort_order) ELSE 'asc' END;
  v_pattern TEXT := NULL;
  v_sql TEXT;
BEGIN
  IF p_search IS NOT NULL AND btrim(p_search) <> '' THEN
    v_pattern := '%' || replace(replace(replace(btrim(p_search), '\\', '\\\\'), '%', '\\%'), '_', '\\_') || '%';
  END IF;

  v_sql := '
    SELECT DISTINCT s.*
    FROM students s
    LEFT JOIN student_shares ss ON ss.student_id = s.id AND ss.teacher_id = $1
    WHERE s.deleted_at IS NULL
      AND (s.teacher_id = $1 OR ss.teacher_id IS NOT NULL)
  ';

  IF v_pattern IS NOT NULL THEN
    v_sql := v_sql || ' AND (s.full_name ILIKE $2 ESCAPE ''\'' OR s.phone ILIKE $2 ESCAPE ''\'') ';
  END IF;

  v_sql := v_sql || format(' ORDER BY %I %s ', v_sort_by, v_sort_order);

  IF p_limit IS NOT NULL AND p_limit > 0 THEN
    v_sql := v_sql || ' LIMIT ' || p_limit::TEXT;
  END IF;

  IF v_pattern IS NOT NULL THEN
    RETURN QUERY EXECUTE v_sql USING p_teacher_id, v_pattern;
  END IF;
  RETURN QUERY EXECUTE v_sql USING p_teacher_id;
END;
$$;

-- Registro público (QR): crea/obtiene alumno por slug (evita depender de RLS en prod)
CREATE OR REPLACE FUNCTION public.public_register_student_for_slug(
  p_slug TEXT,
  p_full_name TEXT,
  p_dni TEXT,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_teacher_id UUID;
  v_existing UUID;
  v_new UUID;
BEGIN
  SELECT t.id INTO v_teacher_id
  FROM teachers t
  WHERE t.public_slug = p_slug
    AND t.public_slug IS NOT NULL
    AND t.public_slug <> ''
  LIMIT 1;

  IF v_teacher_id IS NULL THEN
    RAISE EXCEPTION 'Invalid slug';
  END IF;

  SELECT s.id INTO v_existing
  FROM students s
  WHERE s.teacher_id = v_teacher_id
    AND s.dni = p_dni
    AND s.deleted_at IS NULL
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  INSERT INTO students (teacher_id, full_name, dni, email, phone, status)
  VALUES (v_teacher_id, p_full_name, p_dni, NULLIF(btrim(p_email), ''), NULLIF(btrim(p_phone), ''), 'to_confirm')
  RETURNING id INTO v_new;

  RETURN v_new;
END;
$$;

-- Triggers updated_at
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_periods_updated_at BEFORE UPDATE ON public.periods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_class_types_updated_at BEFORE UPDATE ON public.class_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'profesor')
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = COALESCE(EXCLUDED.full_name, profiles.full_name), updated_at = now();
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tipo de clase por defecto
INSERT INTO public.class_types (name) SELECT 'Clase' WHERE NOT EXISTS (SELECT 1 FROM public.class_types LIMIT 1);

-- =============================================================================
-- Dashboard: KPIs y métricas (007 + 008 + 013 + 014 + 015)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(
  p_period_id UUID DEFAULT NULL,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL,
  p_class_type_id UUID DEFAULT NULL
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
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL
)
RETURNS TABLE (day DATE, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.class_date AS day, COUNT(*)::BIGINT FROM classes c
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id)
    AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to)
    AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
  GROUP BY c.class_date ORDER BY c.class_date;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_by_day(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL
)
RETURNS TABLE (day DATE, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.class_date AS day, COUNT(ca.id)::BIGINT FROM class_attendances ca
  JOIN classes c ON c.id = ca.class_id
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id)
    AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to)
    AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
  GROUP BY c.class_date ORDER BY c.class_date;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_by_weekday(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL
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
  GROUP BY EXTRACT(DOW FROM c.class_date::timestamp), n.n ORDER BY weekday;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_by_time_slot(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL
)
RETURNS TABLE (time_slot TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (c.start_time::TEXT)::TEXT AS time_slot, COUNT(ca.id)::BIGINT
  FROM class_attendances ca JOIN classes c ON c.id = ca.class_id
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
  GROUP BY c.start_time ORDER BY count DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_students_activity_summary(p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL)
RETURNS TABLE (status TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH dr AS (SELECT COALESCE(p_date_from, (SELECT MIN(class_date) FROM classes)) AS d_from, COALESCE(p_date_to, (SELECT MAX(class_date) FROM classes)) AS d_to),
  last_15 AS (SELECT DISTINCT ca.student_id FROM class_attendances ca JOIN classes c ON c.id = ca.class_id, dr WHERE c.class_date >= (dr.d_from - INTERVAL '15 days') AND c.class_date <= dr.d_to),
  last_30 AS (SELECT DISTINCT ca.student_id FROM class_attendances ca JOIN classes c ON c.id = ca.class_id, dr WHERE c.class_date >= (dr.d_from - INTERVAL '30 days') AND c.class_date <= dr.d_to),
  base AS (SELECT id FROM students WHERE deleted_at IS NULL),
  inactive AS (SELECT id FROM base EXCEPT SELECT student_id FROM last_15),
  at_risk AS (SELECT id FROM base EXCEPT SELECT student_id FROM last_30)
  SELECT 'active' AS status, (SELECT COUNT(*)::BIGINT FROM last_15) AS count
  UNION ALL SELECT 'inactive', (SELECT COUNT(*)::BIGINT FROM inactive)
  UNION ALL SELECT 'at_risk', (SELECT COUNT(*)::BIGINT FROM at_risk);
$$;

CREATE OR REPLACE FUNCTION public.get_new_students_by_month(p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL)
RETURNS TABLE (month DATE, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT date_trunc('month', created_at::date)::date AS month, COUNT(*)::BIGINT FROM students
  WHERE deleted_at IS NULL AND (p_date_from IS NULL OR created_at::date >= p_date_from) AND (p_date_to IS NULL OR created_at::date <= p_date_to)
  GROUP BY date_trunc('month', created_at::date) ORDER BY month;
$$;

CREATE OR REPLACE FUNCTION public.get_active_students_evolution(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL
)
RETURNS TABLE (day DATE, active_count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH filtered_classes AS (
    SELECT c.id, c.class_date FROM classes c
    WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
      AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
      AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
  ),
  days AS (SELECT generate_series(COALESCE(p_date_from, (SELECT MIN(class_date) FROM classes)), COALESCE(p_date_to, (SELECT MAX(class_date) FROM classes)), '1 day'::interval)::date AS day)
  SELECT d.day, (SELECT COUNT(DISTINCT ca.student_id)::BIGINT FROM class_attendances ca JOIN filtered_classes fc ON fc.id = ca.class_id
    WHERE fc.class_date >= (d.day - INTERVAL '15 days') AND fc.class_date <= d.day) FROM days d ORDER BY d.day;
$$;

CREATE OR REPLACE FUNCTION public.get_teachers_performance_summary(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_class_type_id UUID DEFAULT NULL
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

CREATE OR REPLACE FUNCTION public.get_students_by_teacher()
RETURNS TABLE (teacher_id UUID, teacher_name TEXT, student_count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id AS teacher_id, COALESCE(p.full_name, 'Sin nombre')::TEXT AS teacher_name, COUNT(s.id)::BIGINT AS student_count
  FROM teachers t JOIN profiles p ON p.id = t.profile_id LEFT JOIN students s ON s.teacher_id = t.id AND s.deleted_at IS NULL
  GROUP BY t.id, p.full_name ORDER BY student_count DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_class_type_performance_summary(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (class_type_id UUID, class_type_name TEXT, classes_count BIGINT, total_attendances BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH filtered_classes AS (
    SELECT c.id, c.class_type_id, c.class_date FROM classes c
    WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
      AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
  ),
  agg AS (SELECT fc.class_type_id, COUNT(DISTINCT fc.id)::BIGINT AS classes_count, COUNT(ca.id)::BIGINT AS total_attendances
    FROM filtered_classes fc LEFT JOIN class_attendances ca ON ca.class_id = fc.id GROUP BY fc.class_type_id)
  SELECT a.class_type_id, ct.name::TEXT, a.classes_count, a.total_attendances FROM agg a JOIN class_types ct ON ct.id = a.class_type_id ORDER BY a.total_attendances DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_attendance_by_class_type_over_time(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (day DATE, class_type_name TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.class_date AS day, ct.name::TEXT AS class_type_name, COUNT(ca.id)::BIGINT
  FROM class_attendances ca JOIN classes c ON c.id = ca.class_id JOIN class_types ct ON ct.id = c.class_type_id
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
  GROUP BY c.class_date, ct.id, ct.name ORDER BY c.class_date, ct.name;
$$;

-- Cancelaciones (013)
CREATE OR REPLACE FUNCTION public.get_top_students_by_cancellations(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (student_id UUID, student_name TEXT, cancellation_count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id AS student_id, s.full_name AS student_name, COUNT(a.id)::BIGINT AS cancellation_count
  FROM class_absences a JOIN classes c ON c.id = a.class_id JOIN students s ON s.id = a.student_id AND s.deleted_at IS NULL
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
  GROUP BY s.id, s.full_name ORDER BY cancellation_count DESC LIMIT 15;
$$;

CREATE OR REPLACE FUNCTION public.get_cancellations_by_day(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (day DATE, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.class_date AS day, COUNT(a.id)::BIGINT FROM class_absences a JOIN classes c ON c.id = a.class_id
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
  GROUP BY c.class_date ORDER BY c.class_date;
$$;

CREATE OR REPLACE FUNCTION public.get_cancellations_by_weekday(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (weekday INT, weekday_name TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH names AS (SELECT 0 AS d, 'Domingo' AS n UNION SELECT 1, 'Lunes' UNION SELECT 2, 'Martes' UNION SELECT 3, 'Miércoles' UNION SELECT 4, 'Jueves' UNION SELECT 5, 'Viernes' UNION SELECT 6, 'Sábado')
  SELECT (EXTRACT(DOW FROM c.class_date::timestamp))::INT AS weekday, n.n AS weekday_name, COUNT(a.id)::BIGINT
  FROM class_absences a JOIN classes c ON c.id = a.class_id JOIN names n ON n.d = (EXTRACT(DOW FROM c.class_date::timestamp))::INT
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
  GROUP BY EXTRACT(DOW FROM c.class_date::timestamp), n.n ORDER BY weekday;
$$;

CREATE OR REPLACE FUNCTION public.get_cancellations_by_time_slot(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (time_slot TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (c.start_time::TEXT)::TEXT AS time_slot, COUNT(a.id)::BIGINT FROM class_absences a JOIN classes c ON c.id = a.class_id
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
  GROUP BY c.start_time ORDER BY count DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_teachers_cancellations_ranking(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (teacher_id UUID, teacher_name TEXT, cancellation_count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id AS teacher_id, COALESCE(p.full_name, 'Sin nombre')::TEXT AS teacher_name, COUNT(c.id)::BIGINT AS cancellation_count
  FROM classes c JOIN teachers t ON t.id = c.teacher_id LEFT JOIN profiles p ON p.id = t.profile_id
  WHERE c.status = 'cancel_by_teacher' AND (p_period_id IS NULL OR c.period_id = p_period_id)
    AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to)
    AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
  GROUP BY t.id, p.full_name ORDER BY cancellation_count DESC LIMIT 15;
$$;

-- Individual vs shared (014)
CREATE OR REPLACE FUNCTION public.get_individual_vs_shared_over_time(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL
)
RETURNS TABLE (period TEXT, individual_count BIGINT, shared_count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT to_char(c.class_date, 'YYYY-MM') AS period,
    COUNT(*) FILTER (WHERE COALESCE(c.scope, 'individual') = 'individual')::BIGINT AS individual_count,
    COUNT(*) FILTER (WHERE c.scope = 'shared')::BIGINT AS shared_count
  FROM classes c
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
  GROUP BY to_char(c.class_date, 'YYYY-MM') ORDER BY period;
$$;

CREATE OR REPLACE FUNCTION public.get_individual_vs_shared_by_teacher(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL,
  p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL
)
RETURNS TABLE (teacher_id UUID, teacher_name TEXT, individual_count BIGINT, shared_count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id AS teacher_id, COALESCE(p.full_name, 'Sin nombre')::TEXT AS teacher_name,
    COUNT(*) FILTER (WHERE COALESCE(c.scope, 'individual') = 'individual')::BIGINT AS individual_count,
    COUNT(*) FILTER (WHERE c.scope = 'shared')::BIGINT AS shared_count
  FROM classes c JOIN teachers t ON t.id = c.teacher_id LEFT JOIN profiles p ON p.id = t.profile_id
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from)
    AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
    AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id)
  GROUP BY t.id, p.full_name ORDER BY (COUNT(*) FILTER (WHERE COALESCE(c.scope, 'individual') = 'individual') + COUNT(*) FILTER (WHERE c.scope = 'shared')) DESC;
$$;

-- Cancelaciones extendidas (015)
CREATE OR REPLACE FUNCTION public.get_cancellation_kpis(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (total_cancellations BIGINT, total_classes BIGINT, cancellation_rate_pct NUMERIC, previous_period_cancellations BIGINT, variation_pct NUMERIC, avg_per_teacher NUMERIC, avg_per_student NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT (SELECT COUNT(*)::BIGINT FROM class_absences a JOIN classes c ON c.id = a.class_id WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)) AS absences_count,
      (SELECT COUNT(*)::BIGINT FROM classes c WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id) AND c.status = 'cancel_by_teacher') AS teacher_cancel_count,
      (SELECT COUNT(*)::BIGINT FROM classes c WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)) AS total_classes,
      (SELECT COUNT(DISTINCT c.teacher_id)::BIGINT FROM classes c WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)) AS num_teachers,
      (SELECT COUNT(DISTINCT a.student_id)::BIGINT FROM class_absences a JOIN classes c ON c.id = a.class_id WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)) AS students_with_absence
  ),
  prev_period AS (SELECT COUNT(*)::BIGINT AS prev_abs FROM class_absences a JOIN classes c ON c.id = a.class_id WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id) AND p_date_from IS NOT NULL AND p_date_to IS NOT NULL AND c.class_date >= (p_date_from::date - (p_date_to::date - p_date_from::date + 1)) AND c.class_date < p_date_from::date),
  prev_teacher AS (SELECT COUNT(*)::BIGINT AS prev_teacher_cancel FROM classes c WHERE c.status = 'cancel_by_teacher' AND (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id) AND p_date_from IS NOT NULL AND p_date_to IS NOT NULL AND c.class_date >= (p_date_from::date - (p_date_to::date - p_date_from::date + 1)) AND c.class_date < p_date_from::date)
  SELECT b.absences_count + b.teacher_cancel_count, b.total_classes,
    CASE WHEN b.total_classes > 0 THEN ROUND(((b.absences_count + b.teacher_cancel_count)::NUMERIC / b.total_classes * 100), 1) ELSE 0 END,
    COALESCE(pp.prev_abs, 0) + COALESCE(pt.prev_teacher_cancel, 0),
    CASE WHEN (COALESCE(pp.prev_abs, 0) + COALESCE(pt.prev_teacher_cancel, 0)) > 0 THEN ROUND((((b.absences_count + b.teacher_cancel_count) - (COALESCE(pp.prev_abs, 0) + COALESCE(pt.prev_teacher_cancel, 0)))::NUMERIC / (COALESCE(pp.prev_abs, 0) + COALESCE(pt.prev_teacher_cancel, 0)) * 100), 1) ELSE 0 END,
    CASE WHEN b.num_teachers > 0 THEN ROUND(((b.absences_count + b.teacher_cancel_count)::NUMERIC / b.num_teachers), 1) ELSE 0 END,
    CASE WHEN b.students_with_absence > 0 THEN ROUND((b.absences_count::NUMERIC / b.students_with_absence), 1) ELSE 0 END
  FROM base b CROSS JOIN (SELECT COALESCE((SELECT prev_abs FROM prev_period), 0) AS prev_abs) pp CROSS JOIN (SELECT COALESCE((SELECT prev_teacher_cancel FROM prev_teacher), 0) AS prev_teacher_cancel) pt;
$$;

CREATE OR REPLACE FUNCTION public.get_cancellation_reasons(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (reason_key TEXT, reason_label TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH labels AS (SELECT 'viaje' AS k, 'Viaje' AS lbl UNION SELECT 'enfermedad', 'Enfermedad' UNION SELECT 'trabajo', 'Trabajo' UNION SELECT 'sin_aviso', 'Sin aviso' UNION SELECT 'otro', 'Otro')
  SELECT a.reason_type AS reason_key, l.lbl AS reason_label, COUNT(*)::BIGINT FROM class_absences a JOIN classes c ON c.id = a.class_id JOIN labels l ON l.k = a.reason_type
  WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id)
  GROUP BY a.reason_type, l.lbl ORDER BY COUNT(*) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_cancellations_by_month(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (period TEXT, month_date DATE, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH abs_by_month AS (SELECT to_char(c.class_date, 'YYYY-MM') AS period, date_trunc('month', c.class_date::date)::date AS month_date, COUNT(a.id)::BIGINT AS cnt FROM class_absences a JOIN classes c ON c.id = a.class_id WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id) GROUP BY to_char(c.class_date, 'YYYY-MM'), date_trunc('month', c.class_date::date)),
  teacher_cancel_by_month AS (SELECT to_char(c.class_date, 'YYYY-MM') AS period, date_trunc('month', c.class_date::date)::date AS month_date, COUNT(*)::BIGINT AS cnt FROM classes c WHERE c.status = 'cancel_by_teacher' AND (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id) GROUP BY to_char(c.class_date, 'YYYY-MM'), date_trunc('month', c.class_date::date))
  SELECT COALESCE(a.period, t.period) AS period, COALESCE(a.month_date, t.month_date) AS month_date, (COALESCE(a.cnt, 0) + COALESCE(t.cnt, 0))::BIGINT AS count
  FROM abs_by_month a FULL OUTER JOIN teacher_cancel_by_month t ON a.period = t.period AND a.month_date = t.month_date ORDER BY COALESCE(a.month_date, t.month_date);
$$;

CREATE OR REPLACE FUNCTION public.get_cancellations_by_teacher_over_time(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL
)
RETURNS TABLE (period TEXT, month_date DATE, teacher_id UUID, teacher_name TEXT, count BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH abs_by_teacher_month AS (SELECT to_char(c.class_date, 'YYYY-MM') AS period, date_trunc('month', c.class_date::date)::date AS month_date, t.id AS teacher_id, COALESCE(p.full_name, 'Sin nombre')::TEXT AS teacher_name, COUNT(a.id)::BIGINT AS cnt FROM class_absences a JOIN classes c ON c.id = a.class_id JOIN teachers t ON t.id = c.teacher_id LEFT JOIN profiles p ON p.id = t.profile_id WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id) GROUP BY to_char(c.class_date, 'YYYY-MM'), date_trunc('month', c.class_date::date), t.id, p.full_name),
  teacher_cancel_by_month AS (SELECT to_char(c.class_date, 'YYYY-MM') AS period, date_trunc('month', c.class_date::date)::date AS month_date, t.id AS teacher_id, COALESCE(p.full_name, 'Sin nombre')::TEXT AS teacher_name, COUNT(*)::BIGINT AS cnt FROM classes c JOIN teachers t ON t.id = c.teacher_id LEFT JOIN profiles p ON p.id = t.profile_id WHERE c.status = 'cancel_by_teacher' AND (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id) GROUP BY to_char(c.class_date, 'YYYY-MM'), date_trunc('month', c.class_date::date), t.id, p.full_name)
  SELECT COALESCE(a.period, t.period) AS period, COALESCE(a.month_date, t.month_date) AS month_date, COALESCE(a.teacher_id, t.teacher_id) AS teacher_id, COALESCE(a.teacher_name, t.teacher_name) AS teacher_name, (COALESCE(a.cnt, 0) + COALESCE(t.cnt, 0))::BIGINT AS count
  FROM abs_by_teacher_month a FULL OUTER JOIN teacher_cancel_by_month t ON a.period = t.period AND a.month_date = t.month_date AND a.teacher_id = t.teacher_id ORDER BY COALESCE(a.month_date, t.month_date), (COALESCE(a.cnt, 0) + COALESCE(t.cnt, 0)) DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_individual_vs_shared_totals(
  p_period_id UUID DEFAULT NULL, p_date_from DATE DEFAULT NULL, p_date_to DATE DEFAULT NULL, p_teacher_id UUID DEFAULT NULL, p_class_type_id UUID DEFAULT NULL
)
RETURNS TABLE (individual_total BIGINT, shared_total BIGINT) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*) FILTER (WHERE COALESCE(c.scope, 'individual') = 'individual')::BIGINT, COUNT(*) FILTER (WHERE c.scope = 'shared')::BIGINT
  FROM classes c WHERE (p_period_id IS NULL OR c.period_id = p_period_id) AND (p_date_from IS NULL OR c.class_date >= p_date_from) AND (p_date_to IS NULL OR c.class_date <= p_date_to) AND (p_teacher_id IS NULL OR c.teacher_id = p_teacher_id) AND (p_class_type_id IS NULL OR c.class_type_id = p_class_type_id);
$$;

-- =============================================================================
-- Permisos para los roles de la API (anon, authenticated usan Publishable key).
-- =============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- ============================================================
-- Ejecutar todo en Supabase Dashboard → SQL Editor → New query
-- Pegar este archivo y Run. Crea todas las tablas public + RLS.
-- ============================================================

-- 1) Extension y tipo
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM ('admin', 'profesor');
  END IF;
END
$$;

-- 2) Tablas (si ya existen, se omiten)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role app_role NOT NULL DEFAULT 'profesor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  public_slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_teachers_profile_id ON public.teachers(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_teachers_public_slug ON public.teachers(public_slug);

CREATE TABLE IF NOT EXISTS public.periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT periods_dates_check CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_periods_dates ON public.periods(start_date, end_date);

CREATE TABLE IF NOT EXISTS public.students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  dni TEXT,
  phone TEXT,
  emergency_contact_phone TEXT,
  apto_fisico BOOLEAN,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'to_confirm', 'rejected')),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_students_teacher_id ON public.students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_students_teacher_status ON public.students(teacher_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_teacher_dni ON public.students(teacher_id, dni) WHERE dni IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_deleted_at ON public.students(teacher_id, deleted_at);

CREATE TABLE IF NOT EXISTS public.class_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_class_types_name ON public.class_types(name);

CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  period_id UUID NOT NULL REFERENCES public.periods(id) ON DELETE RESTRICT,
  class_type_id UUID NOT NULL REFERENCES public.class_types(id) ON DELETE RESTRICT,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL DEFAULT '09:00',
  duration_minutes INT NOT NULL DEFAULT 60,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_period_id ON public.classes(period_id);
CREATE INDEX IF NOT EXISTS idx_classes_created_at ON public.classes(created_at);

CREATE TABLE IF NOT EXISTS public.class_attendances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_class_attendances_class_id ON public.class_attendances(class_id);
CREATE INDEX IF NOT EXISTS idx_class_attendances_student_id ON public.class_attendances(student_id);

-- 3) Funciones
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT COALESCE((auth.jwt() -> 'app_metadata' ->> 'role')::app_role, (SELECT role FROM public.profiles WHERE id = auth.uid())); $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT public.get_user_role() = 'admin'; $$;

CREATE OR REPLACE FUNCTION public.get_my_teacher_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT t.id FROM public.teachers t JOIN public.profiles p ON p.id = t.profile_id WHERE p.id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.class_can_edit(class_created_at TIMESTAMPTZ)
RETURNS boolean LANGUAGE sql STABLE
AS $$ SELECT (now() - class_created_at) <= interval '24 hours'; $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'profesor'))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = COALESCE(EXCLUDED.full_name, profiles.full_name), updated_at = now();
  RETURN NEW;
END;
$$;

-- 4) RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_attendances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can do all on class_types" ON public.class_types;
CREATE POLICY "Admins can do all on class_types" ON public.class_types FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Authenticated can read class_types" ON public.class_types;
CREATE POLICY "Authenticated can read class_types" ON public.class_types FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS "Users can update own profile (limited)" ON public.profiles;
CREATE POLICY "Users can update own profile (limited)" ON public.profiles FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Admins can do all on teachers" ON public.teachers;
CREATE POLICY "Admins can do all on teachers" ON public.teachers FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Teachers can view own row" ON public.teachers;
CREATE POLICY "Teachers can view own row" ON public.teachers FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Admins can do all on periods" ON public.periods;
CREATE POLICY "Admins can do all on periods" ON public.periods FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "Authenticated can read periods" ON public.periods;
CREATE POLICY "Authenticated can read periods" ON public.periods FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Teachers can manage own students" ON public.students;
CREATE POLICY "Teachers can manage own students" ON public.students FOR ALL USING (teacher_id = public.get_my_teacher_id()) WITH CHECK (teacher_id = public.get_my_teacher_id());
DROP POLICY IF EXISTS "Admins can view all students" ON public.students;
CREATE POLICY "Admins can view all students" ON public.students FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Teachers can manage own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can select own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can insert own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update own classes within 24h" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete own classes within 24h" ON public.classes;
DROP POLICY IF EXISTS "Admins can view all classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can insert classes for any teacher" ON public.classes;
DROP POLICY IF EXISTS "Admins can update classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can update classes within 24h" ON public.classes;
DROP POLICY IF EXISTS "Admins can delete classes within 24h" ON public.classes;

CREATE POLICY "Teachers can select own classes" ON public.classes FOR SELECT USING (teacher_id = public.get_my_teacher_id());
CREATE POLICY "Teachers can insert own classes" ON public.classes FOR INSERT WITH CHECK (teacher_id = public.get_my_teacher_id());
CREATE POLICY "Teachers can update own classes within 24h" ON public.classes FOR UPDATE USING (teacher_id = public.get_my_teacher_id() AND public.class_can_edit(created_at)) WITH CHECK (teacher_id = public.get_my_teacher_id());
CREATE POLICY "Teachers can delete own classes within 24h" ON public.classes FOR DELETE USING (teacher_id = public.get_my_teacher_id() AND public.class_can_edit(created_at));
CREATE POLICY "Admins can view all classes" ON public.classes FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can insert classes for any teacher" ON public.classes FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update classes within 24h" ON public.classes FOR UPDATE USING (public.is_admin() AND public.class_can_edit(created_at)) WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete classes within 24h" ON public.classes FOR DELETE USING (public.is_admin() AND public.class_can_edit(created_at));

DROP POLICY IF EXISTS "Teachers can manage attendances for own classes" ON public.class_attendances;
CREATE POLICY "Teachers can manage attendances for own classes" ON public.class_attendances FOR ALL
  USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_attendances.class_id AND c.teacher_id = public.get_my_teacher_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_attendances.class_id AND c.teacher_id = public.get_my_teacher_id()));
DROP POLICY IF EXISTS "Admins can view all attendances" ON public.class_attendances;
CREATE POLICY "Admins can view all attendances" ON public.class_attendances FOR SELECT USING (public.is_admin());

-- 5) Triggers
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_teachers_updated_at ON public.teachers;
CREATE TRIGGER set_teachers_updated_at BEFORE UPDATE ON public.teachers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_periods_updated_at ON public.periods;
CREATE TRIGGER set_periods_updated_at BEFORE UPDATE ON public.periods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_students_updated_at ON public.students;
CREATE TRIGGER set_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_class_types_updated_at ON public.class_types;
CREATE TRIGGER set_class_types_updated_at BEFORE UPDATE ON public.class_types FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_classes_updated_at ON public.classes;
CREATE TRIGGER set_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6) Perfiles para usuarios que ya existían en Auth (sin perfil en public.profiles)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', ''), COALESCE((u.raw_user_meta_data->>'role')::app_role, 'profesor')
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Tipo de clase por defecto (para que los profesores puedan crear clases)
INSERT INTO public.class_types (name)
SELECT 'Clase' WHERE NOT EXISTS (SELECT 1 FROM public.class_types LIMIT 1);

-- Marcar como admin únicamente al primer usuario con perfil (un solo admin inicial)
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM public.profiles ORDER BY created_at ASC LIMIT 1);

-- ============================================================
-- Dashboard: ejecutar además migrations/007_dashboard_functions.sql
-- para las funciones RPC del panel de administración.
-- ============================================================

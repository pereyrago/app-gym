-- Grupos predefinidos de alumnos por profesor (atajos al crear clases).
-- Ejecutar en Supabase SQL Editor si la base ya existía sin este cambio.

CREATE TABLE IF NOT EXISTS public.teacher_student_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_teacher_student_groups_teacher_id ON public.teacher_student_groups(teacher_id);

CREATE TABLE IF NOT EXISTS public.teacher_student_group_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES public.teacher_student_groups(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_tsgm_group_id ON public.teacher_student_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_tsgm_student_id ON public.teacher_student_group_members(student_id);

ALTER TABLE public.teacher_student_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_student_group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers manage own student groups" ON public.teacher_student_groups;
CREATE POLICY "Teachers manage own student groups" ON public.teacher_student_groups FOR ALL
  USING (teacher_id = public.get_my_teacher_id())
  WITH CHECK (teacher_id = public.get_my_teacher_id());

DROP POLICY IF EXISTS "Teachers manage members of own groups" ON public.teacher_student_group_members;
CREATE POLICY "Teachers manage members of own groups" ON public.teacher_student_group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teacher_student_groups g
      WHERE g.id = teacher_student_group_members.group_id
        AND g.teacher_id = public.get_my_teacher_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teacher_student_groups g
      WHERE g.id = teacher_student_group_members.group_id
        AND g.teacher_id = public.get_my_teacher_id()
    )
    AND public.teacher_can_use_student(public.get_my_teacher_id(), student_id)
  );

DROP TRIGGER IF EXISTS set_teacher_student_groups_updated_at ON public.teacher_student_groups;
CREATE TRIGGER set_teacher_student_groups_updated_at
  BEFORE UPDATE ON public.teacher_student_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

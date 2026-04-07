-- Quitar límite de 24h para editar/borrar clases (profesor y admin).

DROP POLICY IF EXISTS "Teachers can update own classes within 24h" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete own classes within 24h" ON public.classes;
DROP POLICY IF EXISTS "Admins can update classes within 24h" ON public.classes;
DROP POLICY IF EXISTS "Admins can delete classes within 24h" ON public.classes;
DROP POLICY IF EXISTS "Teachers can update own classes" ON public.classes;
DROP POLICY IF EXISTS "Teachers can delete own classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can update any class" ON public.classes;
DROP POLICY IF EXISTS "Admins can delete any class" ON public.classes;

CREATE POLICY "Teachers can update own classes" ON public.classes FOR UPDATE
  USING (teacher_id = public.get_my_teacher_id())
  WITH CHECK (teacher_id = public.get_my_teacher_id());

CREATE POLICY "Teachers can delete own classes" ON public.classes FOR DELETE
  USING (teacher_id = public.get_my_teacher_id());

CREATE POLICY "Admins can update any class" ON public.classes FOR UPDATE
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete any class" ON public.classes FOR DELETE
  USING (public.is_admin());

DROP FUNCTION IF EXISTS public.class_can_edit(DATE, TIME);

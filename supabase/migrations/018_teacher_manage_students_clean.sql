-- Migración 018: Asegurar gestión total de alumnos para profesores
-- Reafirmamos que el profesor puede hacer TODO (INSERT, UPDATE, DELETE) con sus alumnos.

DROP POLICY IF EXISTS "Teachers can manage own students" ON public.students;

CREATE POLICY "Teachers can manage own students" ON public.students 
  FOR ALL 
  USING (teacher_id = public.get_my_teacher_id()) 
  WITH CHECK (teacher_id = public.get_my_teacher_id());

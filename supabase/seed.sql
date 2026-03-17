-- =============================================================================
-- Seed realista: perfiles → profesores (uno por perfil) → períodos, tipos,
-- alumnos (25 repartidos entre profesores), clases (~55), asistencias y faltas.
--
-- Requisito: al menos un usuario en auth.users (ej. create-admin.js).
-- Crea un profesor por cada perfil; alumnos y clases se reparten entre ellos.
-- =============================================================================

-- Sincronizar perfiles desde auth.users (quienes aún no tengan fila en profiles)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  COALESCE((u.raw_user_meta_data->>'role')::app_role, 'profesor')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Comprobar que haya al menos un perfil (creado desde auth o con fix-missing-profile)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.profiles) = 0 THEN
    RAISE EXCEPTION 'No hay perfiles. Crea antes un usuario: node scripts/create-admin.js (después de ejecutar schema.sql). Ver supabase/README-SETUP.md';
  END IF;
END $$;

-- Crear un profesor por cada perfil que aún no tenga (slug único por perfil)
INSERT INTO public.teachers (profile_id, public_slug)
SELECT p.id, LOWER(SUBSTRING(MD5(p.id::text || COALESCE(p.email, '')) FROM 1 FOR 14))
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.profile_id = p.id);

-- Períodos (para filtros del dashboard y clases)
INSERT INTO public.periods (name, start_date, end_date)
SELECT * FROM (VALUES
  ('Febrero 2026', '2026-02-01'::date, '2026-02-28'::date),
  ('Marzo 2026', '2026-03-01'::date, '2026-03-31'::date)
) AS v(name, start_date, end_date)
WHERE NOT EXISTS (SELECT 1 FROM public.periods p WHERE p.name = v.name);

-- Tipos de clase (el schema ya inserta "Clase")
INSERT INTO public.class_types (name)
SELECT name FROM (VALUES ('Pilates'), ('Funcional'), ('Yoga'), ('Stretching')) AS v(name)
WHERE NOT EXISTS (SELECT 1 FROM public.class_types ct WHERE ct.name = v.name);

-- Variables: profesores (todos), períodos, tipos; repartir alumnos/clases entre profesores
DO $$
DECLARE
  v_teacher_ids UUID[] := ARRAY(SELECT id FROM public.teachers ORDER BY created_at);
  v_num_teachers INT;
  v_teacher_id UUID;
  v_period_feb UUID;
  v_period_mar UUID;
  v_type_pilates UUID;
  v_type_funcional UUID;
  v_type_yoga UUID;
  v_type_clase UUID;
  v_class_status class_status;
  v_student_ids UUID[];
  v_idx INT;
  i INT;
  d DATE;
  s_id UUID;
  r RECORD;
  student_rows TEXT[] := ARRAY[
    'Martina López|martina.lopez@mail.com|active|30111222|+54 11 4444-1111',
    'Juan Pérez|juan.perez@mail.com|active|28222333|+54 11 4444-2222',
    'Sofía García|sofia.garcia@mail.com|active|31444555|',
    'Lucas Martínez|lucas.m@mail.com|active|29555666|+54 11 4444-3333',
    'Valentina Rodríguez|vale.rodriguez@mail.com|active|32666777|',
    'Mateo Fernández|mateo.f@mail.com|active|27888999|+54 11 4444-4444',
    'Emma Sánchez|emma.sanchez@mail.com|active|33000111|',
    'Benjamín Torres|benja.torres@mail.com|active|29111222|',
    'Lucía Díaz|lucia.diaz@mail.com|active|32333444|+54 11 4444-5555',
    'Thiago Ramírez|thiago.r@mail.com|active|28555666|',
    'Isabella Flores|isa.flores@mail.com|active|31777888|',
    'Santiago Gómez|santi.gomez@mail.com|active|29999000|+54 11 4444-6666',
    'Mía Castro|mia.castro@mail.com|active|33222111|',
    'Lucas Ruiz|lucas.ruiz@mail.com|active|27111222|',
    'Catalina Herrera|cata.herrera@mail.com|active|32444333|',
    'Felipe Moreno|felipe.m@mail.com|to_confirm|28666555|',
    'Camila Álvarez|camila.a@mail.com|active|31888777|+54 11 4444-7777',
    'Nicolás Ortiz|nico.ortiz@mail.com|active|30000999|',
    'Elena Silva|elena.silva@mail.com|active|33333111|',
    'Diego Vargas|diego.v@mail.com|active|27222333|',
    'Victoria Romero|vicky.romero@mail.com|active|31555444|',
    'Leonardo Núñez|leo.nunez@mail.com|active|28777666|',
    'Mariana Delgado|mari.delgado@mail.com|active|32111888|',
    'Daniel Morales|daniel.m@mail.com|active|29999001|',
    'Adriana Ríos|adri.rios@mail.com|active|33444222|'
  ];
BEGIN
  v_num_teachers := array_length(v_teacher_ids, 1);
  IF v_num_teachers IS NULL OR v_num_teachers = 0 THEN
    RAISE EXCEPTION 'No hay profesores. Ejecutá schema.sql y create-admin.js (o creá usuarios en Auth) y volvé a correr el seed. Ver supabase/README-SETUP.md';
  END IF;

  SELECT id INTO v_period_feb FROM public.periods WHERE name = 'Febrero 2026' LIMIT 1;
  SELECT id INTO v_period_mar FROM public.periods WHERE name = 'Marzo 2026' LIMIT 1;
  SELECT id INTO v_type_clase FROM public.class_types WHERE name = 'Clase' LIMIT 1;
  SELECT id INTO v_type_pilates FROM public.class_types WHERE name = 'Pilates' LIMIT 1;
  SELECT id INTO v_type_funcional FROM public.class_types WHERE name = 'Funcional' LIMIT 1;
  SELECT id INTO v_type_yoga FROM public.class_types WHERE name = 'Yoga' LIMIT 1;

  IF v_type_pilates IS NULL THEN v_type_pilates := v_type_clase; END IF;
  IF v_type_funcional IS NULL THEN v_type_funcional := v_type_clase; END IF;
  IF v_type_yoga IS NULL THEN v_type_yoga := v_type_clase; END IF;

  -- Alumnos (25): repartidos entre todos los profesores (round-robin)
  FOR v_idx IN 1..array_length(student_rows, 1) LOOP
    v_teacher_id := v_teacher_ids[1 + ((v_idx - 1) % v_num_teachers)];
    INSERT INTO public.students (teacher_id, full_name, email, status, dni, phone)
    VALUES (
      v_teacher_id,
      split_part(student_rows[v_idx], '|', 1),
      NULLIF(trim(split_part(student_rows[v_idx], '|', 2)), ''),
      split_part(student_rows[v_idx], '|', 3)::TEXT,
      NULLIF(trim(split_part(student_rows[v_idx], '|', 4)), ''),
      NULLIF(trim(split_part(student_rows[v_idx], '|', 5)), '')
    );
  END LOOP;

  -- Clases (~55): repartidas entre profesores por día
  v_idx := 0;
  FOR d IN
    SELECT g::date FROM generate_series('2026-02-03'::date, '2026-03-27'::date, '1 day'::interval) g
    WHERE EXTRACT(DOW FROM g) BETWEEN 1 AND 5
    ORDER BY random()
    LIMIT 55
  LOOP
    v_idx := v_idx + 1;
    v_teacher_id := v_teacher_ids[1 + ((v_idx - 1) % v_num_teachers)];
    v_class_status := CASE WHEN random() > 0.12 THEN 'success'::class_status ELSE 'cancel_by_teacher'::class_status END;
    INSERT INTO public.classes (
      teacher_id, period_id, class_type_id, class_date, start_time, duration_minutes,
      status, scope,
      cancellation_reason, cancellation_reason_type
    )
    VALUES (
      v_teacher_id,
      CASE WHEN d < '2026-03-01' THEN v_period_feb ELSE v_period_mar END,
      COALESCE(
        (CASE (floor(random() * 4))::int WHEN 0 THEN v_type_clase WHEN 1 THEN v_type_pilates WHEN 2 THEN v_type_funcional ELSE v_type_yoga END),
        v_type_clase
      ),
      d,
      (CASE (floor(random() * 5))::int WHEN 0 THEN '08:00' WHEN 1 THEN '09:00' WHEN 2 THEN '10:00' WHEN 3 THEN '18:00' ELSE '19:00' END)::time,
      60,
      v_class_status,
      CASE WHEN random() > 0.4 THEN 'shared'::class_scope ELSE 'individual'::class_scope END,
      CASE WHEN v_class_status = 'cancel_by_teacher' THEN 'Emergencia personal' ELSE NULL END,
      CASE WHEN v_class_status = 'cancel_by_teacher' THEN 'otro' ELSE NULL END
    );
  END LOOP;

  -- Asistencias: por cada clase success, 1 a 8 alumnos de ese profesor
  FOR r IN
    SELECT c.id AS class_id, c.teacher_id
    FROM public.classes c
    WHERE c.status = 'success'
    ORDER BY c.class_date, c.start_time
  LOOP
    SELECT ARRAY_AGG(id) INTO v_student_ids FROM public.students WHERE teacher_id = r.teacher_id;
    IF v_student_ids IS NOT NULL AND array_length(v_student_ids, 1) > 0 THEN
      FOR i IN 1..LEAST(1 + (random() * 7)::int, array_length(v_student_ids, 1)) LOOP
        s_id := v_student_ids[1 + (random() * (array_length(v_student_ids, 1) - 1))::int];
        INSERT INTO public.class_attendances (class_id, student_id)
        VALUES (r.class_id, s_id)
        ON CONFLICT (class_id, student_id) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;

  -- Faltas: en algunas clases success, alumnos de ese profesor que no estén en asistencias
  FOR r IN
    SELECT c.id AS class_id, c.teacher_id
    FROM public.classes c
    WHERE c.status = 'success'
    ORDER BY random()
    LIMIT 18
  LOOP
    FOR i IN 1..(1 + (random() * 2)::int) LOOP
      SELECT ss.id INTO s_id
      FROM public.students ss
      WHERE ss.teacher_id = r.teacher_id
        AND NOT EXISTS (SELECT 1 FROM public.class_attendances ca WHERE ca.class_id = r.class_id AND ca.student_id = ss.id)
        AND NOT EXISTS (SELECT 1 FROM public.class_absences ab WHERE ab.class_id = r.class_id AND ab.student_id = ss.id)
      ORDER BY random()
      LIMIT 1;
      IF s_id IS NOT NULL THEN
        INSERT INTO public.class_absences (class_id, student_id, reason_type)
        VALUES (r.class_id, s_id, (ARRAY['viaje', 'enfermedad', 'trabajo', 'sin_aviso', 'otro'])[1 + (random() * 4)::int])
        ON CONFLICT (class_id, student_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Seed listo: % profesor(es), períodos, tipos, 25 alumnos, ~55 clases, asistencias y faltas.', v_num_teachers;
END $$;

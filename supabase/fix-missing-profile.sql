-- Crear perfil para usuarios que están en auth.users pero no en public.profiles.
-- Ejecutar en Supabase → SQL Editor (una vez).

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  COALESCE((u.raw_user_meta_data->>'role')::app_role, 'admin')
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  role = COALESCE(EXCLUDED.role, profiles.role),
  updated_at = now();

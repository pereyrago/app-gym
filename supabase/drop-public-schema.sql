-- =============================================================================
-- Borra TODO lo del schema public (tablas, políticas, funciones, tipos).
-- NO toca auth: auth.users, auth.sessions y la conexión siguen igual.
-- El usuario actual sigue autenticado.
--
-- Después de ejecutar esto, corre supabase/schema.sql para volver a crear todo.
-- =============================================================================

-- 1) Quitar el trigger que vive en auth pero apunta a una función de public.
--    Así no queda un trigger huérfano cuando borremos public.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2) Borrar todo el schema public (tablas, políticas, funciones, tipos, índices, etc.)
DROP SCHEMA public CASCADE;

-- 3) Recrear el schema public vacío
CREATE SCHEMA public;

-- 4) Permisos típicos para Supabase (conexión y roles siguen funcionando)
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- Opcional: habilitar RLS por defecto en tablas nuevas (según tu proyecto)
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ... ;

-- Listo. Auth no se tocó: auth.users y la sesión actual siguen igual.
-- Siguiente paso: ejecutar supabase/schema.sql para crear de nuevo tablas y funciones.

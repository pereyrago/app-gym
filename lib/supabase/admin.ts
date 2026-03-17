import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con clave secreta (Secret API Key). Usar solo para operaciones Auth Admin
 * (crear/eliminar usuarios, resetear contraseña). El resto de la app usa la clave
 * pública (Publishable/anon) con la sesión del usuario.
 */
export function getSupabaseAuthAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey) {
    throw new Error(
      "Falta SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY) en .env.local. Solo necesaria para Auth Admin."
    );
  }
  return createClient(url, secretKey, {
    auth: { persistSession: false },
  });
}

/** @deprecated Usar getSupabaseAuthAdminClient. Alias para compatibilidad. */
export const createAdminClient = getSupabaseAuthAdminClient;

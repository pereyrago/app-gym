import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/types";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Obtiene el perfil del usuario actual usando la clave pública (anon) y la sesión (JWT).
 * RLS "Users can view own profile" permite la lectura.
 */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  return (data as Profile) ?? null;
}

/**
 * Si el usuario existe pero no tiene perfil, intenta crearlo (RLS "Users can insert own profile").
 */
export async function ensureProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const existing = await getProfile();
  if (existing) return existing;

  const role = (user.user_metadata?.role as AppRole) ?? "profesor";
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name: (user.user_metadata?.full_name ?? user.user_metadata?.name ?? "") as string,
        role,
      } as never,
      { onConflict: "id" }
    )
    .select()
    .single();

  if (!error && data) return data as Profile;
  return null;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("No autenticado");
  }
  return user;
}

export async function requireRole(allowed: AppRole[]) {
  const profile = await getProfile();
  if (!profile) {
    throw new Error("No autenticado");
  }
  if (!allowed.includes(profile.role)) {
    throw new Error("Sin permisos");
  }
  return profile;
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}

export async function requireTeacher() {
  return requireRole(["profesor"]);
}

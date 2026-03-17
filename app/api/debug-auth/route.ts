import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/debug-auth — Solo para desarrollo. Quitar en producción.
 * Usa clave pública + sesión (sin secret key).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { id: string; role: string } | null = null;
  let profileError: string | null = null;

  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
    if (error) profileError = error.message;
  }

  return NextResponse.json({
    hasUser: !!user,
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    hasProfile: !!profile,
    profileRole: profile?.role ?? null,
    profileError,
  });
}

import { createClient } from "@/lib/supabase/server";

export async function getMyTeacherId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("teachers").select("id").eq("profile_id", user.id).single();
  return (data as { id: string } | null)?.id ?? null;
}

export async function getMyTeacherSlug(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("teachers")
      .select("public_slug")
      .eq("profile_id", user.id)
      .single();
    return (data as { public_slug: string } | null)?.public_slug ?? null;
  } catch {
    return null;
  }
}

export async function getMyTeacherName(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    return (data as { full_name: string | null } | null)?.full_name ?? null;
  } catch {
    return null;
  }
}

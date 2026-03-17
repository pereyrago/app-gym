import { createClient } from "@/lib/supabase/server";
import type { TeacherWithProfile } from "@/types";

export async function getTeachersWithProfiles(): Promise<TeacherWithProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select(
      `
      id,
      profile_id,
      created_at,
      updated_at,
      profiles:profile_id (email, full_name, role)
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as TeacherWithProfile[];
}

export async function getTeacherById(teacherId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select(
      `
      id,
      profile_id,
      created_at,
      updated_at,
      profiles:profile_id (id, email, full_name, role)
    `
    )
    .eq("id", teacherId)
    .single();

  if (error) throw error;
  return data;
}

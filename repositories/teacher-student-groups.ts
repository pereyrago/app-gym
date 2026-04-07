import { createClient } from "@/lib/supabase/server";

export type TeacherStudentGroupWithStudents = {
  id: string;
  name: string;
  created_at: string;
  student_ids: string[];
};

type MemberRow = { student_id: string };

export async function listTeacherStudentGroups(
  teacherId: string
): Promise<TeacherStudentGroupWithStudents[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_student_groups")
    .select("id, name, created_at, teacher_student_group_members(student_id)")
    .eq("teacher_id", teacherId)
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    student_ids: ((row.teacher_student_group_members ?? []) as MemberRow[]).map((m) => m.student_id),
  }));
}

export async function createTeacherStudentGroup(
  teacherId: string,
  name: string,
  studentIds: string[]
): Promise<string> {
  const supabase = await createClient();
  const { data: group, error: gErr } = await supabase
    .from("teacher_student_groups")
    .insert({ teacher_id: teacherId, name: name.trim() })
    .select("id")
    .single();
  if (gErr) throw gErr;
  const gid = group.id as string;
  if (studentIds.length > 0) {
    const { error: mErr } = await supabase.from("teacher_student_group_members").insert(
      studentIds.map((student_id) => ({ group_id: gid, student_id }))
    );
    if (mErr) {
      await supabase.from("teacher_student_groups").delete().eq("id", gid);
      throw mErr;
    }
  }
  return gid;
}

export async function updateTeacherStudentGroup(
  groupId: string,
  teacherId: string,
  name: string,
  studentIds: string[]
): Promise<void> {
  const supabase = await createClient();
  const { data: existing, error: e0 } = await supabase
    .from("teacher_student_groups")
    .select("id")
    .eq("id", groupId)
    .eq("teacher_id", teacherId)
    .maybeSingle();
  if (e0) throw e0;
  if (!existing) throw new Error("Grupo no encontrado");

  const { error: e1 } = await supabase
    .from("teacher_student_groups")
    .update({ name: name.trim() })
    .eq("id", groupId);
  if (e1) throw e1;

  const { error: delErr } = await supabase
    .from("teacher_student_group_members")
    .delete()
    .eq("group_id", groupId);
  if (delErr) throw delErr;

  if (studentIds.length > 0) {
    const { error: insErr } = await supabase.from("teacher_student_group_members").insert(
      studentIds.map((student_id) => ({ group_id: groupId, student_id }))
    );
    if (insErr) throw insErr;
  }
}

export async function deleteTeacherStudentGroup(groupId: string, teacherId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("teacher_student_groups")
    .delete()
    .eq("id", groupId)
    .eq("teacher_id", teacherId);
  if (error) throw error;
}

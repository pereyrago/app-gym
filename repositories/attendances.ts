import { createClient } from "@/lib/supabase/server";

export async function setClassAttendances(classId: string, studentIds: string[]) {
  const supabase = await createClient();
  await supabase.from("class_attendances").delete().eq("class_id", classId);
  if (studentIds.length === 0) return [];
  const rows = studentIds.map((student_id) => ({ class_id: classId, student_id }));
  const { data, error } = await supabase
    .from("class_attendances")
    .insert(rows as never)
    .select();
  if (error) throw error;
  return data ?? [];
}

export type AbsenceInput = {
  student_id: string;
  reason_type: string;
  reason_other?: string | null;
  observations?: string | null;
};

/**
 * Actualiza faltas: quita las de alumnos que ahora asisten (nowAttendedIds)
 * y añade/actualiza las de `absences`. No borra faltas de otros alumnos (se conservan).
 */
export async function setClassAbsences(
  classId: string,
  nowAttendedIds: string[],
  absences: AbsenceInput[]
) {
  const supabase = await createClient();
  if (nowAttendedIds.length > 0) {
    await supabase
      .from("class_absences")
      .delete()
      .eq("class_id", classId)
      .in("student_id", nowAttendedIds);
  }
  if (absences.length === 0) return [];
  const rows = absences.map((a) => ({
    class_id: classId,
    student_id: a.student_id,
    reason_type: a.reason_type,
    reason_other: a.reason_other ?? null,
    observations: a.observations ?? null,
  }));
  const { data, error } = await supabase
    .from("class_absences")
    .upsert(rows as never, {
      onConflict: "class_id,student_id",
      ignoreDuplicates: false,
    })
    .select();
  if (error) throw error;
  return data ?? [];
}

export async function clearClassAbsences(classId: string) {
  const supabase = await createClient();
  await supabase.from("class_absences").delete().eq("class_id", classId);
}

export async function getAttendancesByClassId(classId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_attendances")
    .select("id, student_id")
    .eq("class_id", classId);
  if (error) throw error;
  return data ?? [];
}

export type AbsenceDetail = {
  student_id: string;
  reason_type: string;
  reason_other: string | null;
  observations: string | null;
};

export async function getAbsencesByClassId(classId: string): Promise<AbsenceDetail[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_absences")
    .select("student_id, reason_type, reason_other, observations")
    .eq("class_id", classId);
  if (error) throw error;
  return (data ?? []) as AbsenceDetail[];
}

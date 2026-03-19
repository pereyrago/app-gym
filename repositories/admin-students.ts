import { createClient } from "@/lib/supabase/server";

export type AdminStudentListRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  dni: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  teacher_id: string;
  emergency_contact_phone: string | null;
  apto_fisico: boolean | null;
  /** Profesor titular (quien dio de alta al alumno en su lista). */
  teacher_profile_full_name: string | null;
  teacher_profile_email: string | null;
};

type RawStudentRow = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  dni: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  teacher_id: string;
  emergency_contact_phone: string | null;
  apto_fisico: boolean | null;
  teachers:
    | {
        profiles: { full_name: string | null; email: string } | null;
      }
    | {
        profiles: { full_name: string | null; email: string } | null;
      }[]
    | null;
};

function normalizeTeachers(
  teachers: RawStudentRow["teachers"]
): { full_name: string | null; email: string } | null {
  if (!teachers) return null;
  const t = Array.isArray(teachers) ? teachers[0] : teachers;
  return t?.profiles ?? null;
}

export async function getAdminStudentBasics(
  studentId: string
): Promise<{ id: string; full_name: string; teacher_id: string } | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id, full_name, teacher_id")
    .eq("id", studentId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data as { id: string; full_name: string; teacher_id: string } | null;
}

/** Todos los alumnos activos (no borrados) con datos del profesor titular. Solo para admin. */
export async function getAdminStudentsList(): Promise<AdminStudentListRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id,
      full_name,
      phone,
      email,
      dni,
      status,
      created_at,
      updated_at,
      teacher_id,
      emergency_contact_phone,
      apto_fisico,
      teachers:teacher_id (
        profiles:profile_id (full_name, email)
      )
    `
    )
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as RawStudentRow[]).map((row) => {
    const p = normalizeTeachers(row.teachers);
    return {
      id: row.id,
      full_name: row.full_name,
      phone: row.phone,
      email: row.email,
      dni: row.dni,
      status: row.status,
      created_at: row.created_at,
      updated_at: row.updated_at,
      teacher_id: row.teacher_id,
      emergency_contact_phone: row.emergency_contact_phone,
      apto_fisico: row.apto_fisico,
      teacher_profile_full_name: p?.full_name ?? null,
      teacher_profile_email: p?.email ?? null,
    };
  });
}

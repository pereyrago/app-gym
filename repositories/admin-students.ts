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

type StudentRowBase = {
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
};

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

/**
 * Todos los alumnos activos (no borrados) con datos del profesor titular. Solo para admin.
 * Dos consultas (sin embed students→teachers) para evitar fallos de PostgREST con relaciones anidadas en prod.
 */
export async function getAdminStudentsList(): Promise<AdminStudentListRow[]> {
  const supabase = await createClient();

  const { data: students, error: stErr } = await supabase
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
      apto_fisico
    `
    )
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (stErr) throw stErr;

  const list = (students ?? []) as StudentRowBase[];
  const teacherIds = [...new Set(list.map((s) => s.teacher_id))];
  if (teacherIds.length === 0) return [];

  const { data: teachers, error: tErr } = await supabase
    .from("teachers")
    .select("id, profiles:profile_id (full_name, email)")
    .in("id", teacherIds);

  if (tErr) throw tErr;

  const profileByTeacherId = new Map<string, { full_name: string | null; email: string }>();
  for (const row of teachers ?? []) {
    const t = row as unknown as {
      id: string;
      profiles:
        | { full_name: string | null; email: string }
        | { full_name: string | null; email: string }[]
        | null;
    };
    const p = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
    if (p) profileByTeacherId.set(t.id, p);
  }

  return list.map((row) => {
    const p = profileByTeacherId.get(row.teacher_id);
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

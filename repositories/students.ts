import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Student } from "@/types";
import type { TablesInsert } from "@/types/database.types";

export type StudentsSortBy = "full_name" | "status";
export type StudentsSortOrder = "asc" | "desc";

export type GetStudentsOptions = {
  search?: string;
  sortBy?: StudentsSortBy;
  sortOrder?: StudentsSortOrder;
};

function escapeIlike(q: string): string {
  return q.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

async function getStudentsByTeacherUncached(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teacherId: string,
  options: GetStudentsOptions = {}
): Promise<Student[]> {
  const { search, sortBy = "full_name", sortOrder = "asc" } = options;
  const pattern = search && search.trim() ? escapeIlike(search.trim()) : null;

  const { data, error } = await supabase.rpc("get_students_for_teacher", {
    p_teacher_id: teacherId,
    p_search: pattern,
    p_sort_by: sortBy,
    p_sort_order: sortOrder,
    p_limit: null,
  });
  if (error) throw error;
  return (data ?? []) as Student[];
}

const CACHE_TAG_PREFIX = "teacher-students";

export function getStudentsByTeacherCacheTag(teacherId: string): string {
  return `${CACHE_TAG_PREFIX}-${teacherId}`;
}

export async function getStudentsByTeacher(
  teacherId: string,
  options: GetStudentsOptions = {}
): Promise<Student[]> {
  const { search = "", sortBy = "full_name", sortOrder = "asc" } = options;
  const cacheKey = `${CACHE_TAG_PREFIX}-${teacherId}-${search}-${sortBy}-${sortOrder}`;
  const supabase = await createClient();
  return unstable_cache(
    () => getStudentsByTeacherUncached(supabase, teacherId, options),
    [cacheKey],
    { revalidate: 60, tags: [getStudentsByTeacherCacheTag(teacherId)] }
  )();
}

export async function createStudent(input: TablesInsert<"students">) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert(input as never)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStudent(
  id: string,
  input: Partial<TablesInsert<"students">>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStudentStatus(
  id: string,
  status: "active" | "to_confirm" | "rejected"
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ status } as never)
    .eq("id", id);
  if (error) throw error;
}

/** Soft delete: marca deleted_at para que no aparezca en listados. */
export async function softDeleteStudent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ deleted_at: new Date().toISOString(), status: "rejected" } as never)
    .eq("id", id);
  if (error) throw error;
}

/**
 * Compatibilidad: cualquier "delete" de alumno debe ser lógico.
 * Mantiene el registro para historial/auditoría.
 */
export async function deleteStudent(id: string) {
  await softDeleteStudent(id);
}

import { createClient } from "@/lib/supabase/server";
import type { Class, ClassWithDetails, ClassWithType } from "@/types";
import type { TablesInsert, TablesUpdate } from "@/types/database.types";

const classesWithTypeSelect = "*, class_types(name)";

/** Normaliza filas de classes (esquema nuevo o legacy con title) a ClassWithType. */
function toClassWithType(row: Record<string, unknown>): ClassWithType {
  const base = { ...row } as Class & { title?: string };
  const classTypes =
    (row.class_types as { name: string } | null) ??
    (base.title != null ? { name: base.title } : null);
  return {
    ...base,
    class_types: classTypes,
    start_time: (base as { start_time?: string }).start_time ?? "09:00",
    duration_minutes: (base as { duration_minutes?: number }).duration_minutes ?? 60,
  } as ClassWithType;
}

export async function getClassesByTeacherAndPeriod(
  teacherId: string,
  periodId: string
): Promise<ClassWithType[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("classes")
    .select(classesWithTypeSelect)
    .eq("teacher_id", teacherId)
    .eq("period_id", periodId)
    .order("class_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (!error && data != null) return data as ClassWithType[];

  const { data: fallbackData, error: fallbackError } = await supabase
    .from("classes")
    .select("*")
    .eq("teacher_id", teacherId)
    .eq("period_id", periodId)
    .order("class_date", { ascending: true });

  if (fallbackError) throw fallbackError;
  return (fallbackData ?? []).map((row) =>
    toClassWithType(row as unknown as Record<string, unknown>)
  );
}

export async function getClassById(classId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .select(classesWithTypeSelect)
    .eq("id", classId)
    .single();

  if (error) throw error;
  return data;
}

export async function getClassWithAttendances(classId: string): Promise<ClassWithDetails | null> {
  const supabase = await createClient();
  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .select(classesWithTypeSelect)
    .eq("id", classId)
    .single();

  if (classError || !classRow) return null;

  const { data: attendances } = await supabase
    .from("class_attendances")
    .select(
      `
      id,
      student_id,
      students (full_name, email, status)
    `
    )
    .eq("class_id", classId);

  const classWithAttendances: ClassWithDetails = {
    ...(classRow as Class),
    class_attendances: (attendances ?? []) as unknown as ClassWithDetails["class_attendances"],
  };
  return classWithAttendances;
}

export async function createClass(input: TablesInsert<"classes">) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .insert(input as never)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClass(id: string, input: TablesUpdate<"classes">) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClass(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) throw error;
}

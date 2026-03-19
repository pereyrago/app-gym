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

export type StudentPeriodClassRow = {
  class: ClassWithType;
  /** Solo hay fila si el profesor marcó asistencia o registró falta. */
  attendance: "attended" | "absent";
  absenceReason?: string;
};

function compareClassSchedule(a: ClassWithType, b: ClassWithType): number {
  const d = String(a.class_date).localeCompare(String(b.class_date));
  if (d !== 0) return d;
  return String(a.start_time ?? "").localeCompare(String(b.start_time ?? ""));
}

/**
 * Solo clases del período del profesor titular donde el alumno tiene **registro**:
 * fila en `class_attendances` (marcado como asistente) o en `class_absences` (falta registrada).
 */
export async function getStudentPeriodClassesWithAttendance(
  studentId: string,
  periodId: string
): Promise<StudentPeriodClassRow[]> {
  const supabase = await createClient();
  const { data: studentRow, error: stErr } = await supabase
    .from("students")
    .select("id, teacher_id")
    .eq("id", studentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (stErr) throw stErr;
  const student = studentRow as { id: string; teacher_id: string } | null;
  if (!student) return [];

  const classes = await getClassesByTeacherAndPeriod(student.teacher_id, periodId);
  if (classes.length === 0) return [];

  const classIdsInPeriod = new Set(classes.map((c) => c.id));

  const [{ data: attendances }, { data: absences }] = await Promise.all([
    supabase.from("class_attendances").select("class_id").eq("student_id", studentId),
    supabase
      .from("class_absences")
      .select("class_id, reason_type, reason_other")
      .eq("student_id", studentId),
  ]);

  const attendedInPeriod = new Set(
    ((attendances ?? []) as { class_id: string }[])
      .map((a) => a.class_id)
      .filter((id) => classIdsInPeriod.has(id))
  );

  const absenceInPeriod = new Map(
    ((absences ?? []) as { class_id: string; reason_type: string; reason_other: string | null }[])
      .filter((a) => classIdsInPeriod.has(a.class_id))
      .map((a) => [a.class_id, a] as const)
  );

  const relevantIds = new Set<string>([...attendedInPeriod, ...absenceInPeriod.keys()]);
  const classById = new Map(classes.map((c) => [c.id, c]));

  const rows: StudentPeriodClassRow[] = [];
  for (const id of relevantIds) {
    const c = classById.get(id);
    if (!c) continue;
    if (attendedInPeriod.has(id)) {
      rows.push({ class: c, attendance: "attended" });
    } else {
      const ab = absenceInPeriod.get(id);
      if (!ab) continue;
      rows.push({
        class: c,
        attendance: "absent",
        absenceReason: ab.reason_other?.trim() || ab.reason_type,
      });
    }
  }

  rows.sort((a, b) => compareClassSchedule(a.class, b.class));
  return rows;
}

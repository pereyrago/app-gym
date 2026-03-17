"use server";

import { createClient } from "@/lib/supabase/server";
import { nowInAppTz, parseClassDateTimeInAppTz, toAppTzDateString } from "@/lib/app-timezone";

export type PublicClassOption = {
  id: string;
  class_date: string;
  start_time: string;
  duration_minutes: number;
  class_type_name: string;
};

export type PublicStudentOption = { id: string; full_name: string };

export async function getPublicTeacherIdBySlug(slug: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .select("id")
    .eq("public_slug", slug)
    .maybeSingle();
  if (error) return null;
  return (data as { id: string } | null)?.id ?? null;
}

/** Clases del profesor: en curso (aún no terminó) o que empiezan en las próximas 24h. Se ocultan cuando la hora de fin ya pasó. */
export async function getPublicClassesNext24h(teacherId: string): Promise<PublicClassOption[]> {
  const supabase = await createClient();
  const now = nowInAppTz();
  const nowUtc = new Date(now.getTime());
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = toAppTzDateString(yesterday);
  const endDateStr = toAppTzDateString(end);

  const { data, error } = await supabase
    .from("classes")
    .select("id, class_date, start_time, duration_minutes, class_types(name)")
    .eq("teacher_id", teacherId)
    .gte("class_date", yesterdayStr)
    .lte("class_date", endDateStr)
    .order("class_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) return [];

  const list = (data ?? []) as unknown as Array<{
    id: string;
    class_date: string;
    start_time: string;
    duration_minutes: number;
    class_types: { name: string } | null;
  }>;

  return list
    .filter((c) => {
      const classStart = parseClassDateTimeInAppTz(c.class_date, c.start_time);
      const durationMs = (c.duration_minutes ?? 60) * 60 * 1000;
      const classEnd = new Date(classStart.getTime() + durationMs);
      const inFuture = classStart > nowUtc && classStart.getTime() <= end.getTime();
      const ongoing = classStart <= nowUtc && classEnd > nowUtc;
      return inFuture || ongoing;
    })
    .map((c) => ({
      id: c.id,
      class_date: c.class_date,
      start_time: String(c.start_time).slice(0, 5),
      duration_minutes: c.duration_minutes,
      class_type_name: c.class_types?.name ?? "Clase",
    }));
}

export async function searchPublicStudents(
  slug: string,
  query: string
): Promise<PublicStudentOption[]> {
  if (!query || query.trim().length < 2) return [];
  const teacherId = await getPublicTeacherIdBySlug(slug);
  if (!teacherId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_students_for_teacher", {
    p_teacher_id: teacherId,
    p_search: query.trim(),
    p_sort_by: "full_name",
    p_sort_order: "asc",
    p_limit: 15,
  });
  if (error) return [];
  return ((data ?? []) as Array<{ id: string; full_name: string }>).map((s) => ({
    id: s.id,
    full_name: s.full_name,
  }));
}

export type SubmitResult = { ok: true; studentId: string } | { ok: false; error: string };

export type NewStudentData = {
  full_name: string;
  dni: string;
  email?: string | null;
  phone?: string | null;
};

/**
 * Si está definida y es "true" o "1", los alumnos nuevos que se registran por link/QR
 * se crean con status "active" (aprobados). Si no existe la variable, se crean con "to_confirm".
 */
const AUTO_APPROVE_QR =
  process.env.AUTO_APPROVE_QR_STUDENTS === "true" || process.env.AUTO_APPROVE_QR_STUDENTS === "1";

/** Registrar asistencia desde la página pública (QR). Si studentId es null y newStudentData existe, crea alumno (to_confirm o active según AUTO_APPROVE_QR_STUDENTS). */
export async function submitPublicAttendance(
  slug: string,
  classId: string,
  studentId: string | null,
  newStudentData: NewStudentData | null
): Promise<SubmitResult> {
  const supabase = await createClient();

  const teacherRow = await supabase
    .from("teachers")
    .select("id")
    .eq("public_slug", slug)
    .maybeSingle();
  const teacher = teacherRow.data as { id: string } | null;
  if (!teacher) return { ok: false, error: "Enlace no válido" };

  const classRow = await supabase
    .from("classes")
    .select("id, teacher_id, class_date, start_time, duration_minutes")
    .eq("id", classId)
    .eq("teacher_id", teacher.id)
    .single();
  if (classRow.error || !classRow.data) return { ok: false, error: "Clase no válida" };

  const c = classRow.data as {
    class_date: string;
    start_time: string;
    duration_minutes: number | null;
  };
  const classStart = parseClassDateTimeInAppTz(c.class_date, c.start_time);
  const durationMs = (c.duration_minutes ?? 60) * 60 * 1000;
  const classEnd = new Date(classStart.getTime() + durationMs);
  const now = new Date();
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  if (now >= classEnd || classStart > end)
    return { ok: false, error: "La clase ya no admite asistencias por QR" };

  let sid: string;

  if (studentId) {
    const { data: allowed, error: allowedErr } = await supabase.rpc("teacher_can_use_student", {
      p_teacher_id: teacher.id,
      p_student_id: studentId,
    });
    if (allowedErr || !allowed) return { ok: false, error: "Alumno no encontrado" };
    sid = studentId;
  } else if (newStudentData?.full_name?.trim() && newStudentData?.dni?.trim()) {
    const name = newStudentData.full_name.trim();
    const dni = newStudentData.dni.trim().replace(/\s/g, "");
    if (dni.length < 7 || dni.length > 12)
      return { ok: false, error: "DNI inválido (entre 7 y 12 caracteres)." };
    const { data: existing } = await supabase
      .from("students")
      .select("id")
      .eq("teacher_id", teacher.id)
      .eq("dni", dni)
      .is("deleted_at", null)
      .maybeSingle();
    if (existing) {
      sid = (existing as { id: string }).id;
    } else {
      const { data: newStudent, error: insertErr } = await supabase
        .from("students")
        .insert({
          teacher_id: teacher.id,
          full_name: name,
          dni,
          email: newStudentData.email?.trim() || null,
          phone: newStudentData.phone?.trim() || null,
          status: AUTO_APPROVE_QR ? "active" : "to_confirm",
        } as never)
        .select("id")
        .single();
      if (insertErr)
        return {
          ok: false,
          error: insertErr.message.includes("unique")
            ? "Ya existe un alumno con ese DNI."
            : "No se pudo registrar. Intenta de nuevo.",
        };
      sid = (newStudent as { id: string }).id;
    }
  } else {
    return {
      ok: false,
      error: "Completá nombre y DNI si no estás en la lista, o elegí tu nombre de la lista.",
    };
  }

  const { error: attErr } = await supabase
    .from("class_attendances")
    .upsert({ class_id: classId, student_id: sid }, { onConflict: "class_id,student_id" });
  if (attErr) return { ok: false, error: "No se pudo registrar la asistencia" };

  return { ok: true, studentId: sid };
}

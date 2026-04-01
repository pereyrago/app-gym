"use server";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { TeacherReportRow, AllTeachersReportRow } from "@/lib/pdf";
import type { StudentAttendanceReportRow } from "@/lib/pdf";

export async function getReportDataForTeacher(
  teacherId: string,
  periodId: string
): Promise<TeacherReportRow | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: periodRow } = await supabase
    .from("periods")
    .select("name")
    .eq("id", periodId)
    .single();
  const periodName = (periodRow as { name: string } | null)?.name ?? "Período";

  const { data: teacherRow } = await supabase
    .from("teachers")
    .select("id, profiles:profile_id(full_name, email)")
    .eq("id", teacherId)
    .single();
  const teacher = teacherRow as {
    id: string;
    profiles: { full_name: string | null; email: string } | null;
  } | null;
  if (!teacher) return null;

  const profile = teacher.profiles;
  const teacherName = profile?.full_name ?? profile?.email ?? "Profesor";

  const { data: classesData } = await supabase
    .from("classes")
    .select("id, class_date, start_time, duration_minutes, class_types(name)")
    .eq("teacher_id", teacherId)
    .eq("period_id", periodId)
    .order("class_date", { ascending: true })
    .order("start_time", { ascending: true });

  const classes = (classesData ?? []) as unknown as Array<{
    id: string;
    class_date: string;
    start_time: string;
    duration_minutes: number;
    class_types: { name: string } | null;
  }>;
  if (!classes.length) {
    return { teacherName, periodName, classes: [] };
  }

  const classesWithAttendances = await Promise.all(
    classes.map(async (c) => {
      const { data: attendances } = await supabase
        .from("class_attendances")
        .select("students!inner(full_name, status, deleted_at)")
        .eq("class_id", c.id)
        .is("students.deleted_at", null)
        .eq("students.status", "active");

      const studentNames = (attendances ?? [])
        .map(
          (a) =>
            (
              a as unknown as {
                students: { full_name: string; status: string; deleted_at: string | null } | null;
              }
            ).students?.full_name
        )
        .filter(Boolean) as string[];
      return {
        classTypeName: c.class_types?.name ?? "Clase",
        class_date: c.class_date,
        start_time: c.start_time,
        duration_minutes: c.duration_minutes,
        attendancesCount: studentNames.length,
        studentNames,
      };
    })
  );

  return {
    teacherName,
    periodName,
    classes: classesWithAttendances,
  };
}

export async function getReportDataForAllTeachers(
  periodId: string
): Promise<AllTeachersReportRow[]> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: teachers } = await supabase
    .from("teachers")
    .select("id, profiles:profile_id(full_name, email)");
  if (!teachers?.length) return [];

  const result: AllTeachersReportRow[] = [];

  const teachersList = teachers as unknown as Array<{
    id: string;
    profiles: { full_name: string | null; email: string } | null;
  }>;
  for (const t of teachersList) {
    const profile = t.profiles;
    const teacherName = profile?.full_name ?? profile?.email ?? "Profesor";

    const { data: classesRow } = await supabase
      .from("classes")
      .select("id, class_date, start_time, duration_minutes, class_types(name)")
      .eq("teacher_id", t.id)
      .eq("period_id", periodId)
      .order("class_date", { ascending: true })
      .order("start_time", { ascending: true });

    const classes = (classesRow ?? []) as unknown as Array<{
      id: string;
      class_date: string;
      start_time: string;
      duration_minutes: number;
      class_types: { name: string } | null;
    }>;
    const withCounts = await Promise.all(
      classes.map(async (c) => {
        const { count } = await supabase
          .from("class_attendances")
          .select("students!inner(id, status, deleted_at)", { count: "exact", head: true })
          .eq("class_id", c.id)
          .is("students.deleted_at", null)
          .eq("students.status", "active");
        return {
          classTypeName: c.class_types?.name ?? "Clase",
          class_date: c.class_date,
          start_time: c.start_time,
          duration_minutes: c.duration_minutes,
          attendancesCount: count ?? 0,
        };
      })
    );

    result.push({
      teacherName,
      totalClasses: withCounts.length,
      classes: withCounts,
    });
  }

  return result;
}

export async function getReportDataForStudent(
  studentId: string,
  periodId: string
): Promise<StudentAttendanceReportRow | null> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: periodRow } = await supabase
    .from("periods")
    .select("name")
    .eq("id", periodId)
    .single();
  const periodName = (periodRow as { name: string } | null)?.name ?? "Período";

  const { data: studentRow } = await supabase
    .from("students")
    .select("id, full_name")
    .eq("id", studentId)
    .maybeSingle();
  const student = studentRow as { id: string; full_name: string } | null;
  if (!student) return null;

  const { data: attendanceRows, error: attErr } = await supabase
    .from("class_attendances")
    .select(
      `
      class_id,
      classes!inner (
        class_date,
        duration_minutes,
        class_types (name),
        teachers:teacher_id (profiles:profile_id(full_name, email)),
        period_id
      )
    `
    )
    .eq("student_id", studentId)
    .eq("classes.period_id", periodId);

  if (attErr) throw attErr;

  const rows = (attendanceRows ?? []) as unknown as Array<{
    class_id: string;
    classes: {
      class_date: string;
      duration_minutes: number | null;
      class_types: { name: string } | null;
      teachers:
        | { profiles: { full_name: string | null; email: string } | null }
        | { profiles: { full_name: string | null; email: string } | null }[]
        | null;
      period_id: string;
    } | null;
  }>;

  return {
    studentName: student.full_name,
    periodName,
    classes: rows
      .map((r) => {
        const c = r.classes;
        if (!c) return null;
        const teacherRel = Array.isArray(c.teachers) ? c.teachers[0] : c.teachers;
        const teacherProfile = teacherRel?.profiles ?? null;
        const teacherName = teacherProfile?.full_name ?? teacherProfile?.email ?? "Profesor";
        return {
          class_date: c.class_date,
          classTypeName: c.class_types?.name ?? "Clase",
          teacherName,
          duration_minutes: c.duration_minutes ?? 60,
        };
      })
      .filter(Boolean) as StudentAttendanceReportRow["classes"],
  };
}

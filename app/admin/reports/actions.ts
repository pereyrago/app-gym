"use server";

import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildStudentNamesByClassId, type StudentEmbed } from "@/lib/teacher-report";
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
    .select("id, class_date, start_time, duration_minutes, status, cancellation_reason, class_types(name)")
    .eq("teacher_id", teacherId)
    .eq("period_id", periodId)
    .order("class_date", { ascending: true })
    .order("start_time", { ascending: true });

  const classes = (classesData ?? []) as unknown as Array<{
    id: string;
    class_date: string;
    start_time: string;
    duration_minutes: number;
    status: "success" | "cancel_by_student" | "cancel_by_teacher";
    cancellation_reason: string | null;
    class_types: { name: string } | null;
  }>;
  if (!classes.length) {
    return { teacherName, periodName, classes: [] };
  }

  const classIds = classes.map((c) => c.id);
  const { data: attendanceRows, error: attError } = await supabase
    .from("class_attendances")
    .select("class_id, student_id")
    .in("class_id", classIds);

  if (attError) throw attError;

  const links = (attendanceRows ?? []) as { class_id: string; student_id: string }[];
  const studentIds = [...new Set(links.map((a) => a.student_id))];

  let studentsById = new Map<string, StudentEmbed>();
  if (studentIds.length > 0) {
    const { data: studentRows, error: stError } = await supabase
      .from("students")
      .select("id, full_name, email, status, deleted_at")
      .in("id", studentIds);
    if (stError) throw stError;
    studentsById = new Map(
      ((studentRows ?? []) as Array<StudentEmbed & { id: string }>).map((s) => [s.id, s])
    );
  }

  const namesByClass = buildStudentNamesByClassId(links, studentsById);

  const classesWithAttendances = classes.map((c) => {
    const studentNames = namesByClass.get(c.id) ?? [];
    return {
      classTypeName: c.class_types?.name ?? "Clase",
      class_date: c.class_date,
      start_time: c.start_time,
      duration_minutes: c.duration_minutes,
      attendancesCount: studentNames.length,
      studentNames,
      status: c.status,
      cancellation_reason: c.cancellation_reason,
    };
  });

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

  const teachersList = teachers as unknown as Array<{
    id: string;
    profiles: { full_name: string | null; email: string } | null;
  }>;

  const { data: classesData, error: classesError } = await supabase
    .from("classes")
    .select("id, teacher_id, class_date, start_time, duration_minutes, status, cancellation_reason, class_types(name)")
    .eq("period_id", periodId)
    .order("class_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (classesError) throw classesError;

  const classes = (classesData ?? []) as unknown as Array<{
    id: string;
    teacher_id: string;
    class_date: string;
    start_time: string;
    duration_minutes: number;
    status: "success" | "cancel_by_student" | "cancel_by_teacher";
    cancellation_reason: string | null;
    class_types: { name: string } | null;
  }>;

  const classIds = classes.map((c) => c.id);
  let namesByClass = new Map<string, string[]>();

  if (classIds.length > 0) {
    const { data: attendanceRows, error: attError } = await supabase
      .from("class_attendances")
      .select("class_id, student_id")
      .in("class_id", classIds);

    if (attError) throw attError;

    const links = (attendanceRows ?? []) as { class_id: string; student_id: string }[];
    const studentIds = [...new Set(links.map((a) => a.student_id))];

    let studentsById = new Map<string, StudentEmbed>();
    if (studentIds.length > 0) {
      const { data: studentRows, error: stError } = await supabase
        .from("students")
        .select("id, full_name, email, status, deleted_at")
        .in("id", studentIds);
      if (stError) throw stError;
      studentsById = new Map(
        ((studentRows ?? []) as Array<StudentEmbed & { id: string }>).map((s) => [s.id, s])
      );
    }

    namesByClass = buildStudentNamesByClassId(links, studentsById);
  }

  const classesByTeacher = new Map<string, typeof classes>();
  for (const c of classes) {
    const list = classesByTeacher.get(c.teacher_id) ?? [];
    list.push(c);
    classesByTeacher.set(c.teacher_id, list);
  }

  return teachersList.map((t) => {
    const profile = t.profiles;
    const teacherName = profile?.full_name?.trim()
      ? profile.full_name
      : (profile?.email ?? "Profesor");
    const teacherClasses = classesByTeacher.get(t.id) ?? [];
    const mapped = teacherClasses.map((c) => {
      const studentNames = namesByClass.get(c.id) ?? [];
      return {
        classTypeName: c.class_types?.name ?? "Clase",
        class_date: c.class_date,
        start_time: c.start_time,
        duration_minutes: c.duration_minutes,
        attendancesCount: studentNames.length,
        studentNames,
        status: c.status,
        cancellation_reason: c.cancellation_reason,
      };
    });

    return {
      teacherName,
      totalClasses: mapped.length,
      classes: mapped,
    };
  });
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

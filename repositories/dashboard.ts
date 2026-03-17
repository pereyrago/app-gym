import { subDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toAppTzDateString } from "@/lib/app-timezone";

export type DashboardStats = {
  totalStudents: number;
  activeStudents: number; // asistieron en los últimos 15 días
  classTypesCount: number;
  classTypeWithMostStudents: { name: string; count: number } | null;
  teacherWithMostClasses: { name: string; count: number } | null;
  teacherWithMostStudents: { name: string; count: number } | null;
  teacherWithMostStudentsPerClass: { name: string; avgPerClass: number } | null;
  timeSlotWithMostAttendance: { time: string; count: number } | null;
  dayWithMostAttendance: { dayName: string; count: number } | null;
};

const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export async function getDashboardStats(supabase: SupabaseClient): Promise<DashboardStats> {
  const [
    totalStudentsRes,
    classTypesCountRes,
    classesRes,
    attendancesRes,
    studentsRes,
    teachersWithProfilesRes,
    classTypesRes,
  ] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).is("deleted_at", null),
    supabase.from("class_types").select("id", { count: "exact", head: true }),
    supabase.from("classes").select("id, teacher_id, class_type_id, class_date, start_time"),
    supabase.from("class_attendances").select("class_id, student_id"),
    supabase.from("students").select("id, teacher_id").is("deleted_at", null),
    supabase.from("teachers").select("id, profiles:profile_id(full_name)"),
    supabase.from("class_types").select("id, name"),
  ]);

  const totalStudents = totalStudentsRes.count ?? 0;
  const classTypesCount = classTypesCountRes.count ?? 0;
  const classes = (classesRes.data ?? []) as Array<{
    id: string;
    teacher_id: string;
    class_type_id: string;
    class_date: string;
    start_time: string;
  }>;
  const attendances = (attendancesRes.data ?? []) as Array<{
    class_id: string;
    student_id: string;
  }>;
  const students = (studentsRes.data ?? []) as Array<{ id: string; teacher_id: string }>;
  const teachersWithProfiles = (teachersWithProfilesRes.data ?? []) as unknown as Array<{
    id: string;
    profiles: { full_name: string | null } | null;
  }>;
  const classTypes = (classTypesRes.data ?? []) as Array<{ id: string; name: string }>;

  const teacherNameById = new Map(
    teachersWithProfiles.map((t) => [t.id, t.profiles?.full_name ?? "Sin nombre"])
  );
  const classTypeNameById = new Map(classTypes.map((ct) => [ct.id, ct.name]));
  const classById = new Map(classes.map((c) => [c.id, c]));

  const cutoffDate = toAppTzDateString(subDays(new Date(), 15));
  const classIdsLast15Days = new Set(
    classes.filter((c) => c.class_date >= cutoffDate).map((c) => c.id)
  );
  const activeStudentIds = new Set(
    attendances.filter((a) => classIdsLast15Days.has(a.class_id)).map((a) => a.student_id)
  );
  const activeStudents = activeStudentIds.size;

  const studentsByClassType = new Map<string, Set<string>>();
  for (const a of attendances) {
    const c = classById.get(a.class_id);
    if (!c) continue;
    let set = studentsByClassType.get(c.class_type_id);
    if (!set) {
      set = new Set();
      studentsByClassType.set(c.class_type_id, set);
    }
    set.add(a.student_id);
  }
  let classTypeWithMostStudents: { name: string; count: number } | null = null;
  for (const [typeId, set] of studentsByClassType) {
    const count = set.size;
    const name = classTypeNameById.get(typeId) ?? typeId;
    if (!classTypeWithMostStudents || count > classTypeWithMostStudents.count) {
      classTypeWithMostStudents = { name, count };
    }
  }

  const classesByTeacher = new Map<string, number>();
  for (const c of classes) {
    classesByTeacher.set(c.teacher_id, (classesByTeacher.get(c.teacher_id) ?? 0) + 1);
  }
  let teacherWithMostClasses: { name: string; count: number } | null = null;
  for (const [teacherId, count] of classesByTeacher) {
    const name = teacherNameById.get(teacherId) ?? teacherId;
    if (!teacherWithMostClasses || count > teacherWithMostClasses.count) {
      teacherWithMostClasses = { name, count };
    }
  }

  const studentsByTeacher = new Map<string, number>();
  for (const s of students) {
    studentsByTeacher.set(s.teacher_id, (studentsByTeacher.get(s.teacher_id) ?? 0) + 1);
  }
  let teacherWithMostStudents: { name: string; count: number } | null = null;
  for (const [teacherId, count] of studentsByTeacher) {
    const name = teacherNameById.get(teacherId) ?? teacherId;
    if (!teacherWithMostStudents || count > teacherWithMostStudents.count) {
      teacherWithMostStudents = { name, count };
    }
  }

  const attendancesByClass = new Map<string, number>();
  for (const a of attendances) {
    attendancesByClass.set(a.class_id, (attendancesByClass.get(a.class_id) ?? 0) + 1);
  }
  const totalAttendancesByTeacher = new Map<string, number>();
  const classCountByTeacher = new Map<string, number>();
  for (const c of classes) {
    classCountByTeacher.set(c.teacher_id, (classCountByTeacher.get(c.teacher_id) ?? 0) + 1);
    const att = attendancesByClass.get(c.id) ?? 0;
    totalAttendancesByTeacher.set(
      c.teacher_id,
      (totalAttendancesByTeacher.get(c.teacher_id) ?? 0) + att
    );
  }
  let teacherWithMostStudentsPerClass: { name: string; avgPerClass: number } | null = null;
  for (const [teacherId, totalAtt] of totalAttendancesByTeacher) {
    const classCount = classCountByTeacher.get(teacherId) ?? 1;
    const avgPerClass = totalAtt / classCount;
    const name = teacherNameById.get(teacherId) ?? teacherId;
    if (
      !teacherWithMostStudentsPerClass ||
      avgPerClass > teacherWithMostStudentsPerClass.avgPerClass
    ) {
      teacherWithMostStudentsPerClass = { name, avgPerClass };
    }
  }

  const countByTimeSlot = new Map<string, number>();
  for (const a of attendances) {
    const c = classById.get(a.class_id);
    if (!c) continue;
    const time = String(c.start_time).slice(0, 5);
    countByTimeSlot.set(time, (countByTimeSlot.get(time) ?? 0) + 1);
  }
  let timeSlotWithMostAttendance: { time: string; count: number } | null = null;
  for (const [time, count] of countByTimeSlot) {
    if (!timeSlotWithMostAttendance || count > timeSlotWithMostAttendance.count) {
      timeSlotWithMostAttendance = { time, count };
    }
  }

  const countByDayOfWeek = new Map<number, number>();
  for (const a of attendances) {
    const c = classById.get(a.class_id);
    if (!c) continue;
    const dayOfWeek = new Date(c.class_date + "Z").getUTCDay();
    countByDayOfWeek.set(dayOfWeek, (countByDayOfWeek.get(dayOfWeek) ?? 0) + 1);
  }
  let dayWithMostAttendance: { dayName: string; count: number } | null = null;
  for (const [dow, count] of countByDayOfWeek) {
    const dayName = WEEKDAY_NAMES[dow] ?? String(dow);
    if (!dayWithMostAttendance || count > dayWithMostAttendance.count) {
      dayWithMostAttendance = { dayName, count };
    }
  }

  return {
    totalStudents,
    activeStudents,
    classTypesCount,
    classTypeWithMostStudents,
    teacherWithMostClasses,
    teacherWithMostStudents,
    teacherWithMostStudentsPerClass,
    timeSlotWithMostAttendance,
    dayWithMostAttendance,
  };
}

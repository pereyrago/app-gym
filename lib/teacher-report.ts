export type StudentEmbed = {
  full_name: string | null;
  email: string | null;
  status: string;
  deleted_at: string | null;
};

export function normalizeStudentEmbed(students: unknown): StudentEmbed | null {
  if (!students) return null;
  if (Array.isArray(students)) {
    const first = students[0];
    if (!first || typeof first !== "object") return null;
    return first as StudentEmbed;
  }
  if (typeof students === "object") return students as StudentEmbed;
  return null;
}

export function pickStudentDisplayName(student: StudentEmbed | null): string | null {
  if (!student) return null;
  const name = student.full_name?.trim();
  if (name) return name;
  const email = student.email?.trim();
  if (email) return email;
  return null;
}

/** Incluye asistencias registradas; excluye alumnos borrados o rechazados. */
export function isIncludedInReport(student: StudentEmbed | null): boolean {
  if (!student) return false;
  if (student.deleted_at != null) return false;
  return student.status !== "rejected";
}

export type AttendanceRow = {
  class_id: string;
  students: unknown;
};

export type AttendanceLink = {
  class_id: string;
  student_id: string;
};

export function buildStudentNamesByClassId(
  attendances: AttendanceLink[],
  studentsById: Map<string, StudentEmbed>
): Map<string, string[]> {
  const byClass = new Map<string, string[]>();

  for (const row of attendances) {
    const student = studentsById.get(row.student_id) ?? null;
    if (!isIncludedInReport(student)) continue;
    const name = pickStudentDisplayName(student);
    if (!name) continue;
    const list = byClass.get(row.class_id) ?? [];
    list.push(name);
    byClass.set(row.class_id, list);
  }

  for (const [classId, names] of byClass) {
    byClass.set(classId, [...names].sort((a, b) => a.localeCompare(b, "es")));
  }

  return byClass;
}

/** Compat embed-based (tests). Prefer buildStudentNamesByClassId in produccion. */
export function groupAttendancesByClassId(rows: AttendanceRow[]): Map<string, string[]> {
  const byClass = new Map<string, string[]>();
  for (const row of rows) {
    const student = normalizeStudentEmbed(row.students);
    if (!isIncludedInReport(student)) continue;
    const name = pickStudentDisplayName(student);
    if (!name) continue;
    const list = byClass.get(row.class_id) ?? [];
    list.push(name);
    byClass.set(row.class_id, list);
  }
  for (const [classId, names] of byClass) {
    byClass.set(classId, [...names].sort((a, b) => a.localeCompare(b, "es")));
  }
  return byClass;
}

export type TeacherReportClassInput = {
  classTypeName: string;
  class_date: string;
  start_time?: string;
  duration_minutes?: number;
  attendancesCount: number;
  studentNames: string[];
};

export type TeacherLiquidationRow = {
  label: string;
  type: string;
  qty: number;
  totalAlumnos: number;
  total: number;
};

export function getLiquidationCategory(attendancesCount: number): 1 | 2 | 3 {
  if (attendancesCount <= 1) return 1;
  if (attendancesCount === 2) return 2;
  return 3;
}

export function buildTeacherLiquidationRows(
  classes: TeacherReportClassInput[],
  options: { group2StudentMultiplier?: number; group3StudentMultiplier?: number } = {}
): TeacherLiquidationRow[] {
  const group2 = options.group2StudentMultiplier ?? 0.75;
  const group3 = options.group3StudentMultiplier ?? 0.5;

  const groups: Record<
    string,
    { qty: number; totalAlumnos: number; type: string; dur: number; count: 1 | 2 | 3 }
  > = {};

  for (const c of classes) {
    const dur = (c.duration_minutes ?? 60) === 90 ? 90 : 60;
    const cat = getLiquidationCategory(c.attendancesCount);
    const key = `${c.classTypeName}-${dur}-${cat}`;
    if (!groups[key]) {
      groups[key] = { qty: 0, totalAlumnos: 0, type: c.classTypeName, dur, count: cat };
    }
    groups[key].qty += 1;
    groups[key].totalAlumnos += c.attendancesCount;
  }

  const rows: TeacherLiquidationRow[] = [];
  for (const g of Object.values(groups)) {
    const mult = g.count === 1 ? 1 : g.count === 2 ? group2 : group3;
    const label = g.count === 1 ? "Individual" : g.count === 2 ? "Grupal (2)" : "Grupal (3+)";
    rows.push({
      label: `${label} x ${g.dur}m`,
      type: g.type,
      qty: g.qty,
      totalAlumnos: g.totalAlumnos,
      total: g.qty * g.count * mult,
    });
  }

  return rows;
}

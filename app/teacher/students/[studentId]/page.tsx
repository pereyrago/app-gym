import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatClassDate } from "@/lib/app-timezone";
import { getProfile } from "@/lib/auth";
import { getMyTeacherId } from "@/lib/teacher";
import { ChevronLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ClassRow = {
  id: string;
  teacher_id: string;
  class_date: string;
  start_time: string;
  duration_minutes: number;
  status: string;
  scope: string;
  class_types: { name: string } | null;
  teachers?: { profiles?: { full_name: string | null; email: string } | null } | null;
};

type AttendanceRow = { class_id: string };
type AbsenceRow = { class_id: string; reason_type: string; reason_other: string | null };

async function teacherCanUseStudent(teacherId: string, studentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("teacher_can_use_student", {
    p_teacher_id: teacherId,
    p_student_id: studentId,
  });
  if (error) return false;
  return Boolean(data);
}

interface PageProps {
  params: Promise<{ studentId: string }>;
}

export default async function TeacherStudentHistoryPage({ params }: PageProps) {
  const { studentId } = await params;
  const profile = await getProfile();
  if (!profile) notFound();

  const supabase = await createClient();

  const { data: studentRow } = await supabase
    .from("students")
    .select("id, full_name, phone, email, dni")
    .eq("id", studentId)
    .maybeSingle();
  const student = studentRow as
    | { id: string; full_name: string; phone: string | null; email: string | null; dni: string | null }
    | null;
  if (!student) notFound();

  const isAdmin = profile.role === "admin";

  let myTeacherId: string | null = null;
  if (!isAdmin) {
    myTeacherId = await getMyTeacherId();
    if (!myTeacherId) notFound();
    const allowed = await teacherCanUseStudent(myTeacherId, studentId);
    if (!allowed) notFound();
  }

  const [{ data: attendances }, { data: absences }] = await Promise.all([
    supabase.from("class_attendances").select("class_id").eq("student_id", studentId),
    supabase
      .from("class_absences")
      .select("class_id, reason_type, reason_other")
      .eq("student_id", studentId),
  ]);

  const attendedIds = new Set(((attendances ?? []) as AttendanceRow[]).map((a) => a.class_id));
  const absencesList = (absences ?? []) as unknown as AbsenceRow[];
  const absenceByClassId = new Map(absencesList.map((a) => [a.class_id, a]));

  const classIds = Array.from(new Set([...attendedIds, ...absenceByClassId.keys()]));
  if (classIds.length === 0) {
    return (
      <div className="space-y-6">
        <nav aria-label="Breadcrumb" className="mb-1">
          <Link
            href="/teacher/students"
            className="inline-flex items-center text-[13px] text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Alumnos
          </Link>
        </nav>
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight capitalize">{student.full_name}</h1>
          <p className="text-[13px] text-muted-foreground">Historial de clases</p>
        </div>
        <div className="rounded border border-border/80 p-6 text-center text-[13px] text-muted-foreground">
          Sin clases registradas para este alumno.
        </div>
      </div>
    );
  }

  let classesQuery = supabase
    .from("classes")
    .select(
      isAdmin
        ? "id, teacher_id, class_date, start_time, duration_minutes, status, scope, class_types(name), teachers:teacher_id(profiles:profile_id(full_name,email))"
        : "id, teacher_id, class_date, start_time, duration_minutes, status, scope, class_types(name)"
    )
    .in("id", classIds)
    .order("class_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (!isAdmin && myTeacherId) {
    classesQuery = classesQuery.eq("teacher_id", myTeacherId);
  }

  const { data: classesData, error: classesErr } = await classesQuery;
  if (classesErr) throw classesErr;
  const classes = (classesData ?? []) as unknown as ClassRow[];

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="mb-1">
        <Link
          href="/teacher/students"
          className="inline-flex items-center text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-3.5 w-3.5" />
          Alumnos
        </Link>
      </nav>

      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight capitalize">{student.full_name}</h1>
        <p className="text-[13px] text-muted-foreground">Historial de clases</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead>Tipo</TableHead>
            {isAdmin ? <TableHead>Profesor</TableHead> : null}
            <TableHead>Estado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((c) => {
            const attended = attendedIds.has(c.id);
            const absence = absenceByClassId.get(c.id);
            const statusLabel = attended
              ? "Asistió"
              : absence
                ? `Faltó (${absence.reason_other?.trim() || absence.reason_type})`
                : "—";

            const teacherName =
              c.teachers?.profiles?.full_name ?? c.teachers?.profiles?.email ?? "—";

            return (
              <TableRow key={c.id}>
                <TableCell>
                  {formatClassDate(c.class_date, "d MMM yyyy")}
                </TableCell>
                <TableCell className="font-mono text-[13px]">
                  {String(c.start_time).slice(0, 5)}
                </TableCell>
                <TableCell>{c.duration_minutes ?? 60} min</TableCell>
                <TableCell className="capitalize">{c.class_types?.name ?? "Clase"}</TableCell>
                {isAdmin ? <TableCell className="capitalize">{teacherName}</TableCell> : null}
                <TableCell>{statusLabel}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}


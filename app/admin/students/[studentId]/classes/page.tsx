import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPeriods } from "@/repositories/periods";
import { getStudentPeriodClassesWithAttendance } from "@/repositories/classes";
import { getAdminStudentBasics } from "@/repositories/admin-students";
import { AdminStudentClassesView } from "@/features/admin/admin-student-classes-view";

interface PageProps {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<{ periodId?: string }>;
}

export default async function AdminStudentClassesPage({ params, searchParams }: PageProps) {
  const { studentId } = await params;
  const { periodId } = await searchParams;

  const [student, periods] = await Promise.all([
    getAdminStudentBasics(studentId),
    getPeriods(),
  ]);

  if (!student) notFound();

  const selectedPeriodId = periodId ?? periods[0]?.id;
  const rows = selectedPeriodId
    ? await getStudentPeriodClassesWithAttendance(studentId, selectedPeriodId)
    : [];

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          Admin
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href="/admin/students" className="text-muted-foreground hover:text-foreground">
          Alumnos
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium capitalize">{student.full_name}</span>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">Clases</span>
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/students"
          className="inline-flex items-center text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-3.5 w-3.5" />
          Volver a alumnos
        </Link>
        <h1 className="text-lg font-semibold tracking-tight capitalize">
          Clases — {student.full_name}
        </h1>
      </div>
      <p className="text-[13px] text-muted-foreground">
        Solo aparecen clases en las que el profesor marcó al alumno como asistente o registró una
        falta. Verde: asistió. Rojo: no asistió.
      </p>
      <AdminStudentClassesView
        periods={periods}
        selectedPeriodId={selectedPeriodId ?? null}
        rows={rows}
      />
    </div>
  );
}

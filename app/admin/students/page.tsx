import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAdminStudentsList } from "@/repositories/admin-students";
import { AdminStudentsTable } from "@/features/admin/admin-students-table";
import { AdminStudentsFilter } from "@/features/admin/admin-students-filter";

interface PageProps {
  searchParams: Promise<{ teacherId?: string }>;
}

export default async function AdminStudentsPage({ searchParams }: PageProps) {
  const { teacherId } = await searchParams;
  const students = await getAdminStudentsList();
  const selectedTeacherId = teacherId ?? "all";
  const teacherOptions = Array.from(
    students.reduce(
      (acc, s) => {
        if (!acc.has(s.teacher_id)) {
          acc.set(
            s.teacher_id,
            s.teacher_profile_full_name?.trim() || s.teacher_profile_email?.trim() || "Profesor sin nombre"
          );
        }
        return acc;
      },
      new Map<string, string>()
    )
  )
    .map(([teacherId, teacherName]) => ({ teacherId, teacherName }))
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName));

  const filteredStudents =
    selectedTeacherId === "all"
      ? students
      : students.filter((s) => s.teacher_id === selectedTeacherId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Breadcrumb">
          <Link
            href="/admin"
            className="inline-flex items-center text-[13px] text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Admin
          </Link>
        </nav>
        <h1 className="text-lg font-semibold tracking-tight">Alumnos</h1>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-[13px] text-muted-foreground">
          Filtrá por profesor para facilitar la lectura. También podés elegir &quot;Todos&quot;.
        </p>
        <AdminStudentsFilter options={teacherOptions} selectedTeacherId={selectedTeacherId} />
      </div>
      <p className="text-[13px] text-muted-foreground">
        Tocá una fila para ver todos los datos del alumno y el profesor que lo registró. Tocá &quot;Ver clases&quot; para ver el historial.
      </p>
      <AdminStudentsTable students={filteredStudents} />
    </div>
  );
}

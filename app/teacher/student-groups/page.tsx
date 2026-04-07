import Link from "next/link";
import { ChevronLeft, UsersRound } from "lucide-react";
import { getMyTeacherId } from "@/lib/teacher";
import { getStudentsByTeacher } from "@/repositories/students";
import { listTeacherStudentGroups } from "@/repositories/teacher-student-groups";
import { TeacherStudentGroupsManager } from "@/features/teacher/teacher-student-groups-manager";

export default async function TeacherStudentGroupsPage() {
  const teacherId = await getMyTeacherId();
  if (!teacherId) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        No se encontró tu perfil de profesor.
      </div>
    );
  }

  const [students, groups] = await Promise.all([
    getStudentsByTeacher(teacherId),
    listTeacherStudentGroups(teacherId),
  ]);

  const sortedStudents = [...students].sort((a, b) =>
    a.full_name.localeCompare(b.full_name, "es")
  );

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="mb-1">
        <Link
          href="/teacher"
          className="inline-flex items-center text-[13px] text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="mr-1 h-3.5 w-3.5" />
          Profesor
        </Link>
      </nav>
      <div className="flex flex-wrap items-center gap-2">
        <UsersRound className="h-5 w-5 text-muted-foreground" aria-hidden />
        <h1 className="text-lg font-semibold tracking-tight">Grupos de alumnos</h1>
      </div>
      <TeacherStudentGroupsManager initialGroups={groups} students={sortedStudents} />
    </div>
  );
}

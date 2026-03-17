import Link from "next/link";
import { getMyTeacherId } from "@/lib/teacher";
import { getStudentsByTeacher } from "@/repositories/students";
import type { StudentsSortBy, StudentsSortOrder } from "@/repositories/students";
import { StudentsTable } from "@/features/teacher/students-table";
import { CreateStudentDialog } from "@/features/teacher/create-student-dialog";
import { ChevronLeft } from "lucide-react";

type SearchParams = Promise<{
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}>;

export default async function TeacherStudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const teacherId = await getMyTeacherId();
  if (!teacherId) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        No se encontró tu perfil de profesor.
      </div>
    );
  }

  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const sortBy: StudentsSortBy = params.sortBy === "status" ? "status" : "full_name";
  const sortOrder: StudentsSortOrder = params.sortOrder === "desc" ? "desc" : "asc";

  const students = await getStudentsByTeacher(teacherId, {
    search: search || undefined,
    sortBy,
    sortOrder,
  });

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Alumnos</h1>
        <CreateStudentDialog />
      </div>
      <StudentsTable students={students} search={search} sortBy={sortBy} sortOrder={sortOrder} />
    </div>
  );
}

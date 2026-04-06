import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAdminStudentsList } from "@/repositories/admin-students";
import { AdminStudentsTable } from "@/features/admin/admin-students-table";

export default async function AdminStudentsPage() {
  const students = await getAdminStudentsList();

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
      <p className="text-[13px] text-muted-foreground">
        Tocá una fila para ver todos los datos del alumno y el profesor que lo registró. Tocá &quot;Ver clases&quot; para ver el historial.
      </p>
      <AdminStudentsTable students={students} />
    </div>
  );
}

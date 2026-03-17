import Link from "next/link";
import { getTeachersWithProfiles } from "@/repositories/teachers";
import { TeachersTable } from "@/features/admin/teachers-table";
import { CreateTeacherDialog } from "@/features/admin/create-teacher-dialog";
import { ChevronLeft } from "lucide-react";

export default async function AdminTeachersPage() {
  const teachers = await getTeachersWithProfiles();

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
        <h1 className="text-lg font-semibold tracking-tight">Profesores</h1>
      </div>
      <div className="flex justify-end">
        <CreateTeacherDialog />
      </div>
      <TeachersTable teachers={teachers} />
    </div>
  );
}

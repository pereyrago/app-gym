import Link from "next/link";
import { getTeachersWithProfiles } from "@/repositories/teachers";
import { getPeriods } from "@/repositories/periods";
import { getAdminStudentsList } from "@/repositories/admin-students";
import { ReportsView } from "@/features/admin/reports-view";
import { ChevronLeft } from "lucide-react";

export default async function AdminReportsPage() {
  const [teachers, periods, students] = await Promise.all([
    getTeachersWithProfiles(),
    getPeriods(),
    getAdminStudentsList(),
  ]);

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
        <h1 className="text-lg font-semibold tracking-tight">Informes PDF</h1>
      </div>
      <ReportsView
        teachers={teachers}
        periods={periods}
        students={students.map((s) => ({ id: s.id, full_name: s.full_name }))}
      />
    </div>
  );
}

import { Suspense } from "react";
import Link from "next/link";
import { subDays } from "date-fns";
import { toAppTzDateString } from "@/lib/app-timezone";
import { getCurrentPeriod } from "@/repositories/periods";
import { getTeachersWithProfiles } from "@/repositories/teachers";
import { getStudents } from "@/repositories/students";
import type { DashboardFilters } from "@/features/dashboard/types";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardFiltersClient } from "@/components/dashboard/dashboard-filters";
import { DashboardPreviewSection } from "@/app/admin/dashboard/dashboard-sections";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

async function getDefaultDateRange() {
  const current = await getCurrentPeriod();
  if (current && "start_date" in current && "end_date" in current) {
    return { dateFrom: current.start_date, dateTo: current.end_date };
  }
  const today = toAppTzDateString(new Date());
  return {
    dateFrom: toAppTzDateString(subDays(new Date(), 30)),
    dateTo: today,
  };
}

const previewFallback = (
  <div className="space-y-6">
    <Skeleton className="h-32 w-full rounded-lg" />
    <Skeleton className="h-96 w-full rounded-lg" />
  </div>
);

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const [defaultRange, teachers, students] = await Promise.all([
    getDefaultDateRange(),
    getTeachersWithProfiles(),
    getStudents(),
  ]);

  const filters: DashboardFilters = {
    dateFrom: typeof params.date_from === "string" ? params.date_from : defaultRange.dateFrom,
    dateTo: typeof params.date_to === "string" ? params.date_to : defaultRange.dateTo,
    teacherId: typeof params.teacher_id === "string" ? params.teacher_id : null,
    studentId: typeof params.student_id === "string" ? params.student_id : null,
    classMode:
      params.class_mode === "individual" || params.class_mode === "shared"
        ? params.class_mode
        : null,
  };

  const teacherOptions = teachers.map((t) => ({
    id: t.id,
    full_name: t.profiles?.full_name ?? null,
  }));
  const studentOptions = students.map((s) => ({
    id: s.id,
    full_name: s.full_name ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9 rounded-lg hover:bg-muted/80"
          asChild
        >
          <Link href="/admin" aria-label="Volver al inicio">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <DashboardHeader
          title="Dashboard Ejecutivo"
          description="Resumen general de la operación"
        />
      </div>

      <DashboardFiltersClient
        filters={filters}
        teachers={teacherOptions}
        students={studentOptions}
      />

      <Suspense fallback={previewFallback}>
        <DashboardPreviewSection filters={filters} />
      </Suspense>
    </div>
  );
}

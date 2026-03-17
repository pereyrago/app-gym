import { Suspense } from "react";
import Link from "next/link";
import { subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { toAppTzDateString } from "@/lib/app-timezone";
import { getPeriods, getCurrentPeriod } from "@/repositories/periods";
import { getTeachersWithProfiles } from "@/repositories/teachers";
import { getClassTypes } from "@/repositories/class-types";
import {
  getDashboardKpis,
  getClassesByDay,
  getAttendanceByDay,
  getAttendanceByWeekday,
  getAttendanceByTimeSlot,
  getStudentsActivitySummary,
  getNewStudentsByMonth,
  getActiveStudentsEvolution,
  getTeachersPerformanceSummary,
  getStudentsByTeacher,
  getClassTypePerformanceSummary,
  getAttendanceByClassTypeOverTime,
  getTopStudentsByCancellations,
  getCancellationsByWeekday,
  getCancellationsByTimeSlot,
  getTeachersCancellationsRanking,
  getCancellationKpis,
  getCancellationReasons,
  getCancellationsByMonth,
  getCancellationsByTeacherOverTime,
  getIndividualVsSharedOverTime,
  getIndividualVsSharedByTeacher,
  getIndividualVsSharedTotals,
} from "@/repositories/dashboard-queries";
import type { DashboardFilters } from "@/features/dashboard/types";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardFiltersClient } from "@/components/dashboard/dashboard-filters";
import { DashboardTabsContent } from "@/components/dashboard/dashboard-tabs-content";
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

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const defaultRange = await getDefaultDateRange();
  const filters: DashboardFilters = {
    periodId: typeof params.period_id === "string" ? params.period_id : null,
    dateFrom: typeof params.date_from === "string" ? params.date_from : defaultRange.dateFrom,
    dateTo: typeof params.date_to === "string" ? params.date_to : defaultRange.dateTo,
    teacherId: typeof params.teacher_id === "string" ? params.teacher_id : null,
    classTypeId: typeof params.class_type_id === "string" ? params.class_type_id : null,
  };

  const supabase = await createClient();

  const [
    periods,
    teachers,
    classTypes,
    kpis,
    classesByDay,
    attendanceByDay,
    attendanceByWeekday,
    attendanceByTimeSlot,
    studentsActivity,
    newStudentsByMonth,
    activeStudentsEvolution,
    teachersPerformance,
    studentsByTeacher,
    classTypePerformance,
    attendanceByClassTypeOverTime,
    topStudentsCancellations,
    cancellationsByWeekday,
    cancellationsByTimeSlot,
    teachersCancellationsRanking,
    cancellationKpis,
    cancellationReasons,
    cancellationsByMonth,
    cancellationsByTeacherOverTime,
    individualVsSharedOverTime,
    individualVsSharedByTeacher,
    individualVsSharedTotals,
  ] = await Promise.all([
    getPeriods(),
    getTeachersWithProfiles(),
    getClassTypes(),
    getDashboardKpis(supabase, filters),
    getClassesByDay(supabase, filters),
    getAttendanceByDay(supabase, filters),
    getAttendanceByWeekday(supabase, filters),
    getAttendanceByTimeSlot(supabase, filters),
    getStudentsActivitySummary(supabase, filters.dateFrom, filters.dateTo),
    getNewStudentsByMonth(supabase, filters.dateFrom, filters.dateTo),
    getActiveStudentsEvolution(supabase, filters),
    getTeachersPerformanceSummary(supabase, filters),
    getStudentsByTeacher(supabase),
    getClassTypePerformanceSummary(supabase, filters),
    getAttendanceByClassTypeOverTime(supabase, filters),
    getTopStudentsByCancellations(supabase, filters),
    getCancellationsByWeekday(supabase, filters),
    getCancellationsByTimeSlot(supabase, filters),
    getTeachersCancellationsRanking(supabase, filters),
    getCancellationKpis(supabase, filters),
    getCancellationReasons(supabase, filters),
    getCancellationsByMonth(supabase, filters),
    getCancellationsByTeacherOverTime(supabase, filters),
    getIndividualVsSharedOverTime(supabase, filters),
    getIndividualVsSharedByTeacher(supabase, filters),
    getIndividualVsSharedTotals(supabase, filters),
  ]);

  const topTimeSlot = attendanceByTimeSlot[0]?.time_slot ?? null;
  const topWeekday = attendanceByWeekday[0]?.weekday_name ?? null;
  const topClassType = classTypePerformance[0]?.class_type_name ?? null;
  const topTeacherByAvg = teachersPerformance[0]?.teacher_name ?? null;

  const periodOptions = periods.map((p) => ({ id: p.id, name: p.name }));
  const teacherOptions = teachers.map((t) => ({
    id: t.id,
    full_name: t.profiles?.full_name ?? null,
  }));
  const classTypeOptions = classTypes.map((ct) => ({ id: ct.id, name: ct.name }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link href="/admin" aria-label="Volver al inicio">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <DashboardHeader />
      </div>

      <Suspense fallback={<Skeleton className="h-32 w-full rounded-lg" />}>
        <DashboardFiltersClient
          filters={filters}
          periods={periodOptions}
          teachers={teacherOptions}
          classTypes={classTypeOptions}
        />
      </Suspense>

      <DashboardTabsContent
        kpis={kpis}
        classesByDay={classesByDay}
        attendanceByDay={attendanceByDay}
        attendanceByWeekday={attendanceByWeekday}
        attendanceByTimeSlot={attendanceByTimeSlot}
        studentsActivity={studentsActivity}
        newStudentsByMonth={newStudentsByMonth}
        activeStudentsEvolution={activeStudentsEvolution}
        teachersPerformance={teachersPerformance}
        studentsByTeacher={studentsByTeacher}
        classTypePerformance={classTypePerformance}
        attendanceByClassTypeOverTime={attendanceByClassTypeOverTime}
        topStudentsCancellations={topStudentsCancellations}
        cancellationsByWeekday={cancellationsByWeekday}
        cancellationsByTimeSlot={cancellationsByTimeSlot}
        teachersCancellationsRanking={teachersCancellationsRanking}
        cancellationKpis={cancellationKpis}
        cancellationReasons={cancellationReasons}
        cancellationsByMonth={cancellationsByMonth}
        cancellationsByTeacherOverTime={cancellationsByTeacherOverTime}
        individualVsSharedOverTime={individualVsSharedOverTime}
        individualVsSharedByTeacher={individualVsSharedByTeacher}
        individualVsSharedTotals={individualVsSharedTotals}
        topTimeSlot={topTimeSlot}
        topWeekday={topWeekday}
        topClassType={topClassType}
        topTeacherByAvg={topTeacherByAvg}
      />
    </div>
  );
}

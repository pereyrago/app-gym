import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
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
  getCancellationsBySource,
  getCancellationsByMonth,
  getCancellationsByTeacherOverTime,
  getIndividualVsSharedOverTime,
  getIndividualVsSharedByTeacher,
  getIndividualVsSharedTotals,
} from "@/repositories/dashboard-queries";
import {
  getExecutiveSummaryKpis,
  getBusinessEvolutionByDay,
  getTeacherRankingMetrics,
  getStudentRankingMetrics,
} from "@/repositories/dashboard-executive-queries";
import type { DashboardFilters } from "@/features/dashboard/types";
import { ExecutiveSummaryKpisSection } from "@/components/dashboard/executive-summary-kpis";
import { BusinessPerformanceSection } from "@/components/dashboard/business-performance-section";
import { DashboardTabsContent } from "@/components/dashboard/dashboard-tabs-content";
import { StudentsRankingTable } from "@/components/dashboard/students-ranking-table";
import { SectionCard } from "@/components/dashboard/section-card";
import { Skeleton } from "@/components/ui/skeleton";

const detailsFallback = (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-96 w-full rounded-lg" />
  </div>
);

const rankingFallback = <Skeleton className="h-[240px] w-full rounded-md" />;

/**
 * Preview liviana (~4 RPCs). Al terminar, dispara el resto en cascada
 * para no saturar el pool de conexiones de Supabase.
 */
export async function DashboardPreviewSection({ filters }: { filters: DashboardFilters }) {
  const supabase = await createClient();
  const [executiveSummaryKpis, businessEvolution, teacherRanking, studentsByTeacher] =
    await Promise.all([
      getExecutiveSummaryKpis(supabase, filters),
      getBusinessEvolutionByDay(supabase, filters),
      getTeacherRankingMetrics(supabase, filters),
      getStudentsByTeacher(supabase),
    ]);

  return (
    <>
      <ExecutiveSummaryKpisSection data={executiveSummaryKpis} />
      <BusinessPerformanceSection
        businessEvolution={businessEvolution}
        teacherRanking={teacherRanking}
        studentsByTeacher={studentsByTeacher}
      />
      <Suspense fallback={detailsFallback}>
        <DashboardDetailsSection filters={filters} />
      </Suspense>
    </>
  );
}

async function DashboardDetailsSection({ filters }: { filters: DashboardFilters }) {
  const supabase = await createClient();
  const [
    kpis,
    classesByDay,
    attendanceByDay,
    attendanceByWeekday,
    attendanceByTimeSlot,
    studentsActivity,
    newStudentsByMonth,
    activeStudentsEvolution,
    teachersPerformance,
    classTypePerformance,
    attendanceByClassTypeOverTime,
    topStudentsCancellations,
    cancellationsByWeekday,
    cancellationsByTimeSlot,
    teachersCancellationsRanking,
    cancellationKpis,
    cancellationReasons,
    cancellationsBySource,
    cancellationsByMonth,
    cancellationsByTeacherOverTime,
    individualVsSharedOverTime,
    individualVsSharedByTeacher,
    individualVsSharedTotals,
  ] = await Promise.all([
    getDashboardKpis(supabase, filters),
    getClassesByDay(supabase, filters),
    getAttendanceByDay(supabase, filters),
    getAttendanceByWeekday(supabase, filters),
    getAttendanceByTimeSlot(supabase, filters),
    getStudentsActivitySummary(supabase, filters.dateFrom, filters.dateTo),
    getNewStudentsByMonth(supabase, filters.dateFrom, filters.dateTo),
    getActiveStudentsEvolution(supabase, filters),
    getTeachersPerformanceSummary(supabase, filters),
    getClassTypePerformanceSummary(supabase, filters),
    getAttendanceByClassTypeOverTime(supabase, filters),
    getTopStudentsByCancellations(supabase, filters),
    getCancellationsByWeekday(supabase, filters),
    getCancellationsByTimeSlot(supabase, filters),
    getTeachersCancellationsRanking(supabase, filters),
    getCancellationKpis(supabase, filters),
    getCancellationReasons(supabase, filters),
    getCancellationsBySource(supabase, filters),
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

  return (
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
      classTypePerformance={classTypePerformance}
      attendanceByClassTypeOverTime={attendanceByClassTypeOverTime}
      topStudentsCancellations={topStudentsCancellations}
      cancellationsByWeekday={cancellationsByWeekday}
      cancellationsByTimeSlot={cancellationsByTimeSlot}
      teachersCancellationsRanking={teachersCancellationsRanking}
      cancellationKpis={cancellationKpis}
      cancellationReasons={cancellationReasons}
      cancellationsBySource={cancellationsBySource}
      cancellationsByMonth={cancellationsByMonth}
      cancellationsByTeacherOverTime={cancellationsByTeacherOverTime}
      individualVsSharedOverTime={individualVsSharedOverTime}
      individualVsSharedByTeacher={individualVsSharedByTeacher}
      individualVsSharedTotals={individualVsSharedTotals}
      topTimeSlot={topTimeSlot}
      topWeekday={topWeekday}
      topClassType={topClassType}
      topTeacherByAvg={topTeacherByAvg}
      studentRankingSlot={
        <Suspense fallback={rankingFallback}>
          <StudentRankingSection filters={filters} />
        </Suspense>
      }
    />
  );
}

async function StudentRankingSection({ filters }: { filters: DashboardFilters }) {
  const supabase = await createClient();
  const studentRanking = await getStudentRankingMetrics(supabase, filters);
  return (
    <SectionCard title="Ranking de alumnos" description="Ordenable por columnas">
      <StudentsRankingTable data={studentRanking} />
    </SectionCard>
  );
}

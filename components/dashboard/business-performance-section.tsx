"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "@/components/dashboard/section-card";
import type { BusinessEvolutionRow, TeacherRankingRow, StudentsByTeacherRow } from "@/features/dashboard/types";

const chartFallback = () => <Skeleton className="h-[280px] w-full rounded-md" />;

const BusinessEvolutionChart = dynamic(
  () =>
    import("@/components/dashboard/charts/business-evolution-chart").then(
      (m) => m.BusinessEvolutionChart
    ),
  { loading: chartFallback }
);
const TeacherRankingChart = dynamic(
  () =>
    import("@/components/dashboard/charts/teacher-ranking-chart").then((m) => m.TeacherRankingChart),
  { loading: chartFallback }
);
const StudentsByTeacherChart = dynamic(
  () =>
    import("@/components/dashboard/charts/students-by-teacher-chart").then(
      (m) => m.StudentsByTeacherChart
    ),
  { loading: chartFallback }
);

type BusinessPerformanceSectionProps = {
  businessEvolution: BusinessEvolutionRow[];
  teacherRanking: TeacherRankingRow[];
  studentsByTeacher: StudentsByTeacherRow[];
};

export function BusinessPerformanceSection({
  businessEvolution,
  teacherRanking,
  studentsByTeacher,
}: BusinessPerformanceSectionProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Evolución y rendimiento</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="Evolución del negocio"
          description="Clases, horas, alumnos activos, nuevos alumnos y cancelaciones por día"
        >
          <BusinessEvolutionChart data={businessEvolution} />
        </SectionCard>
        <SectionCard
          title="Ranking de profesores"
          description="Clases dadas, horas, alumnos, cancelaciones y asistencia"
        >
          <TeacherRankingChart data={teacherRanking} />
        </SectionCard>
      </div>
      <SectionCard
        title="Alumnos por profesor"
        chartSummary={`Distribución entre ${studentsByTeacher.length} profesores.`}
      >
        <StudentsByTeacherChart data={studentsByTeacher} />
      </SectionCard>
    </section>
  );
}

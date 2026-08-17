"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionCard } from "@/components/dashboard/section-card";
import { BusinessInsights } from "@/components/dashboard/business-insights";

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
    import("@/components/dashboard/charts/teacher-ranking-chart").then(
      (m) => m.TeacherRankingChart
    ),
  { loading: chartFallback }
);
const StudentsByTeacherChart = dynamic(
  () =>
    import("@/components/dashboard/charts/students-by-teacher-chart").then(
      (m) => m.StudentsByTeacherChart
    ),
  { loading: chartFallback }
);
const ClassesByDayChart = dynamic(
  () =>
    import("@/components/dashboard/charts/classes-by-day-chart").then((m) => m.ClassesByDayChart),
  { loading: chartFallback }
);
const AttendanceByDayChart = dynamic(
  () =>
    import("@/components/dashboard/charts/attendance-by-day-chart").then(
      (m) => m.AttendanceByDayChart
    ),
  { loading: chartFallback }
);
const AttendanceByWeekdayChart = dynamic(
  () =>
    import("@/components/dashboard/charts/attendance-by-weekday-chart").then(
      (m) => m.AttendanceByWeekdayChart
    ),
  { loading: chartFallback }
);
const AttendanceByTimeSlotChart = dynamic(
  () =>
    import("@/components/dashboard/charts/attendance-by-time-slot-chart").then(
      (m) => m.AttendanceByTimeSlotChart
    ),
  { loading: chartFallback }
);
const StudentsActivityDonutChart = dynamic(
  () =>
    import("@/components/dashboard/charts/students-activity-donut-chart").then(
      (m) => m.StudentsActivityDonutChart
    ),
  { loading: chartFallback }
);
const NewStudentsByMonthChart = dynamic(
  () =>
    import("@/components/dashboard/charts/new-students-by-month-chart").then(
      (m) => m.NewStudentsByMonthChart
    ),
  { loading: chartFallback }
);
const ActiveStudentsEvolutionChart = dynamic(
  () =>
    import("@/components/dashboard/charts/active-students-evolution-chart").then(
      (m) => m.ActiveStudentsEvolutionChart
    ),
  { loading: chartFallback }
);
const TeacherPerformanceBars = dynamic(
  () =>
    import("@/components/dashboard/charts/teacher-performance-bars").then(
      (m) => m.TeacherPerformanceBars
    ),
  { loading: chartFallback }
);
import { TeachersRankingTable } from "@/components/dashboard/teachers-ranking-table";
const ClassTypePerformanceChart = dynamic(
  () =>
    import("@/components/dashboard/charts/class-type-performance-chart").then(
      (m) => m.ClassTypePerformanceChart
    ),
  { loading: chartFallback }
);
const ClassTypeDistributionDonut = dynamic(
  () =>
    import("@/components/dashboard/charts/class-type-distribution-donut").then(
      (m) => m.ClassTypeDistributionDonut
    ),
  { loading: chartFallback }
);
const AttendanceByClassTypeStackedChart = dynamic(
  () =>
    import("@/components/dashboard/charts/attendance-by-class-type-stacked-chart").then(
      (m) => m.AttendanceByClassTypeStackedChart
    ),
  { loading: chartFallback }
);
const CancellationsByWeekdayChart = dynamic(
  () =>
    import("@/components/dashboard/charts/cancellations-by-weekday-chart").then(
      (m) => m.CancellationsByWeekdayChart
    ),
  { loading: chartFallback }
);
const CancellationsByTimeSlotChart = dynamic(
  () =>
    import("@/components/dashboard/charts/cancellations-by-time-slot-chart").then(
      (m) => m.CancellationsByTimeSlotChart
    ),
  { loading: chartFallback }
);
const TopStudentsCancellationsChart = dynamic(
  () =>
    import("@/components/dashboard/charts/top-students-cancellations-chart").then(
      (m) => m.TopStudentsCancellationsChart
    ),
  { loading: chartFallback }
);
const TeachersCancellationsChart = dynamic(
  () =>
    import("@/components/dashboard/charts/teachers-cancellations-chart").then(
      (m) => m.TeachersCancellationsChart
    ),
  { loading: chartFallback }
);
const CancellationReasonsChart = dynamic(
  () =>
    import("@/components/dashboard/charts/cancellation-reasons-chart").then(
      (m) => m.CancellationReasonsChart
    ),
  { loading: chartFallback }
);
const CancellationsBySourceDonut = dynamic(
  () =>
    import("@/components/dashboard/charts/cancellations-by-source-donut").then(
      (m) => m.CancellationsBySourceDonut
    ),
  { loading: chartFallback }
);
const CancellationsByMonthChart = dynamic(
  () =>
    import("@/components/dashboard/charts/cancellations-by-month-chart").then(
      (m) => m.CancellationsByMonthChart
    ),
  { loading: chartFallback }
);
const CancellationsByTeacherOverTimeChart = dynamic(
  () =>
    import("@/components/dashboard/charts/cancellations-by-teacher-over-time-chart").then(
      (m) => m.CancellationsByTeacherOverTimeChart
    ),
  { loading: chartFallback }
);
const IndividualVsSharedOverTimeStackedAreaChart = dynamic(
  () =>
    import("@/components/dashboard/charts/individual-vs-shared-chart").then(
      (m) => m.IndividualVsSharedOverTimeStackedAreaChart
    ),
  { loading: chartFallback }
);
const IndividualVsSharedByTeacherChart = dynamic(
  () =>
    import("@/components/dashboard/charts/individual-vs-shared-chart").then(
      (m) => m.IndividualVsSharedByTeacherChart
    ),
  { loading: chartFallback }
);
const IndividualVsSharedGlobalChart = dynamic(
  () =>
    import("@/components/dashboard/charts/individual-vs-shared-global-chart").then(
      (m) => m.IndividualVsSharedGlobalChart
    ),
  { loading: chartFallback }
);

import type {
  DashboardKpis,
  DayCount,
  WeekdayCount,
  TimeSlotCount,
  TeacherPerformanceRow,
  ClassTypePerformanceRow,
  AttendanceByClassTypeOverTimeRow,
  StudentCancellationRow,
  TeacherCancellationRow,
  IndividualVsSharedOverTimeRow,
  IndividualVsSharedByTeacherRow,
  StudentsActivityRow,
  NewStudentsByMonth,
  ActiveStudentsEvolutionRow,
  CancellationKpisRow,
  CancellationReasonRow,
  CancellationSourceRow,
  CancellationsByMonthRow,
  CancellationsByTeacherOverTimeRow,
  IndividualVsSharedTotalsRow,
  ExecutiveSummaryKpis,
  TeacherRankingRow,
  BusinessEvolutionRow,
  StudentsByTeacherRow,
} from "@/features/dashboard/types";
import {
  dayCountTable,
  genericCountSummary,
  summarizeDayCounts,
  summarizeTimeSlotCounts,
  summarizeWeekdayCounts,
  timeSlotCountTable,
  weekdayCountTable,
} from "@/lib/chart-summaries";

export type DashboardTabsContentProps = {
  kpis: DashboardKpis | null;
  classesByDay: DayCount[];
  attendanceByDay: DayCount[];
  attendanceByWeekday: WeekdayCount[];
  attendanceByTimeSlot: TimeSlotCount[];
  studentsActivity: StudentsActivityRow[];
  newStudentsByMonth: NewStudentsByMonth[];
  activeStudentsEvolution: ActiveStudentsEvolutionRow[];
  teachersPerformance: TeacherPerformanceRow[];
  classTypePerformance: ClassTypePerformanceRow[];
  attendanceByClassTypeOverTime: AttendanceByClassTypeOverTimeRow[];
  topStudentsCancellations: StudentCancellationRow[];
  cancellationsByWeekday: WeekdayCount[];
  cancellationsByTimeSlot: TimeSlotCount[];
  teachersCancellationsRanking: TeacherCancellationRow[];
  cancellationKpis: CancellationKpisRow | null;
  cancellationReasons: CancellationReasonRow[];
  cancellationsBySource: CancellationSourceRow[];
  studentRankingSlot: ReactNode;
  cancellationsByMonth: CancellationsByMonthRow[];
  cancellationsByTeacherOverTime: CancellationsByTeacherOverTimeRow[];
  individualVsSharedOverTime: IndividualVsSharedOverTimeRow[];
  individualVsSharedByTeacher: IndividualVsSharedByTeacherRow[];
  individualVsSharedTotals: IndividualVsSharedTotalsRow | null;
  topTimeSlot: string | null;
  topWeekday: string | null;
  topClassType: string | null;
  topTeacherByAvg: string | null;
  executiveSummaryKpis?: ExecutiveSummaryKpis | null;
  businessEvolution: BusinessEvolutionRow[];
  teacherRanking?: TeacherRankingRow[] | null;
  studentsByTeacher: StudentsByTeacherRow[];
};

export function DashboardTabsContent(props: DashboardTabsContentProps) {
  const { kpis, topTimeSlot, topWeekday, topClassType, topTeacherByAvg } = props;

  const classesByDayTable = dayCountTable(props.classesByDay);
  const attendanceByDayTable = dayCountTable(props.attendanceByDay);
  const attendanceWeekdayTable = weekdayCountTable(props.attendanceByWeekday);
  const attendanceTimeTable = timeSlotCountTable(props.attendanceByTimeSlot);
  const cancelWeekdayTable = weekdayCountTable(props.cancellationsByWeekday);
  const cancelTimeTable = timeSlotCountTable(props.cancellationsByTimeSlot);

  return (
    <Tabs defaultValue="ejecutivo" className="w-full space-y-6">
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl h-auto p-1 bg-muted/50 border border-border/60">
          <TabsTrigger value="ejecutivo" className="text-[13px] py-1.5 font-medium">
            Resumen Ejecutivo
          </TabsTrigger>
          <TabsTrigger value="asistencias" className="text-[13px] py-1.5 font-medium">
            Asistencias y Clases
          </TabsTrigger>
          <TabsTrigger value="alumnos-profesores" className="text-[13px] py-1.5 font-medium">
            Alumnos y Profesores
          </TabsTrigger>
          <TabsTrigger value="cancelaciones" className="text-[13px] py-1.5 font-medium">
            Cancelaciones
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="ejecutivo" className="mt-0 space-y-5">
        {/* Fila: Evolución del negocio (Ancho completo) */}
        <SectionCard
          title="Evolución del negocio"
          description="Clases, horas, alumnos activos, nuevos alumnos y cancelaciones"
        >
          <BusinessEvolutionChart data={props.businessEvolution} />
        </SectionCard>

        {/* Fila: Cancelaciones por origen (50%) + Motivos de cancelación (50%) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard
            title="Cancelaciones por origen"
            description="Alumno / Profesor / Clima / Otros"
            chartSummary={genericCountSummary(
              props.cancellationsBySource,
              "Sin cancelaciones registradas.",
              "cancelaciones"
            )}
          >
            <CancellationsBySourceDonut data={props.cancellationsBySource} />
          </SectionCard>

          <SectionCard
            title="Motivos de cancelación (Top 5)"
            description="Faltas registradas con motivo"
            chartSummary={genericCountSummary(
              props.cancellationReasons,
              "Sin motivos de cancelación registrados.",
              "faltas"
            )}
          >
            <CancellationReasonsChart data={props.cancellationReasons} />
          </SectionCard>
        </div>

        {/* Fila: Ranking de profesores (50%) + Alumnos por profesor (50%) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard
            title="Ranking de profesores (por clases)"
            description="Clases dictadas en el período"
            chartSummary={`Ranking de ${props.teachersPerformance.length} profesores.`}
          >
            <TeacherRankingChart data={props.teacherRanking ?? []} />
          </SectionCard>

          <SectionCard
            title="Alumnos por profesor"
            description="Distribución de alumnos"
            chartSummary={`Distribución entre ${props.studentsByTeacher.length} profesores.`}
          >
            <StudentsByTeacherChart data={props.studentsByTeacher} />
          </SectionCard>
        </div>

        {/* Fila: Estado de alumnos (50%) + Actividad semanal (50%) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SectionCard
            title="Estado de alumnos"
            description="Activos / En riesgo / Inactivos"
            chartSummary={`Composición de alumnos: ${props.studentsActivity.length} categorías.`}
          >
            <StudentsActivityDonutChart data={props.studentsActivity} />
          </SectionCard>

          <SectionCard
            title="Actividad semanal (por día)"
            description="Concurrencia por día de la semana"
            chartSummary={summarizeWeekdayCounts(props.attendanceByWeekday, "asistencias")}
          >
            <AttendanceByWeekdayChart data={props.attendanceByWeekday} />
          </SectionCard>
        </div>

        {/* 1. Insights del período (100% width) */}
        <SectionCard title="Insights del período" description="Lectura rápida de métricas clave">
          <BusinessInsights
            kpis={kpis}
            topTimeSlot={topTimeSlot}
            topWeekday={topWeekday}
            topClassType={topClassType}
            topTeacherByAvg={topTeacherByAvg}
            executiveSummaryKpis={props.executiveSummaryKpis}
            teacherRanking={props.teacherRanking}
          />
        </SectionCard>

        {/* 2. Profesores con más cancelaciones (100% width) */}
        <SectionCard
          title="Profesores con más cancelaciones"
          description="Clases canceladas por profesor"
          chartSummary={`Ranking de ${props.teachersCancellationsRanking.length} profesores.`}
        >
          <TeachersCancellationsChart
            data={props.teachersCancellationsRanking}
            teacherRanking={props.teacherRanking ?? undefined}
          />
        </SectionCard>

        {/* 3. Ranking de alumnos (100% width) */}
        <div className="w-full">{props.studentRankingSlot}</div>
      </TabsContent>

      <TabsContent value="asistencias" className="mt-0 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Actividad de clases y patrones de concurrencia
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="Clases por día"
              description="Evolución de clases dictadas"
              chartSummary={summarizeDayCounts(props.classesByDay, "clases")}
              chartTableHeaders={classesByDayTable.headers}
              chartTableRows={classesByDayTable.rows}
            >
              <ClassesByDayChart data={props.classesByDay} />
            </SectionCard>
            <SectionCard
              title="Asistencias por día"
              description="Evolución diaria de asistencia"
              chartSummary={summarizeDayCounts(props.attendanceByDay, "asistencias")}
              chartTableHeaders={attendanceByDayTable.headers}
              chartTableRows={attendanceByDayTable.rows}
            >
              <AttendanceByDayChart data={props.attendanceByDay} />
            </SectionCard>
            <SectionCard
              title="Día de la semana con más asistencia"
              description="Patrones semanales de concurrencia"
              chartSummary={summarizeWeekdayCounts(props.attendanceByWeekday, "asistencias")}
              chartTableHeaders={attendanceWeekdayTable.headers}
              chartTableRows={attendanceWeekdayTable.rows}
            >
              <AttendanceByWeekdayChart data={props.attendanceByWeekday} />
            </SectionCard>
            <SectionCard
              title="Franja horaria con más asistencia"
              description="Horarios con mayor demanda"
              chartSummary={summarizeTimeSlotCounts(props.attendanceByTimeSlot, "asistencias")}
              chartTableHeaders={attendanceTimeTable.headers}
              chartTableRows={attendanceTimeTable.rows}
            >
              <AttendanceByTimeSlotChart data={props.attendanceByTimeSlot} />
            </SectionCard>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Análisis por tipo de clase
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="Tipo de clase con más asistencia"
              chartSummary={`Rendimiento por tipo de clase (${props.classTypePerformance.length} tipos).`}
            >
              <ClassTypePerformanceChart data={props.classTypePerformance} />
            </SectionCard>
            <SectionCard
              title="Distribución de clases por tipo"
              chartSummary={`Distribución proporcional de ${props.classTypePerformance.length} tipos de clase.`}
            >
              <ClassTypeDistributionDonut data={props.classTypePerformance} />
            </SectionCard>
          </div>
          <SectionCard
            title="Evolución de asistencia por tipo"
            description="Distribución temporal de concurrencia"
            chartSummary={`Serie temporal de asistencias por tipo (${props.attendanceByClassTypeOverTime.length} registros).`}
          >
            <AttendanceByClassTypeStackedChart data={props.attendanceByClassTypeOverTime} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Clases individuales vs grupales
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="Distribución global"
              description="Total individual vs grupal en el período"
              chartSummary={
                props.individualVsSharedTotals
                  ? `Individual: ${props.individualVsSharedTotals.individual_total}, grupal: ${props.individualVsSharedTotals.shared_total}.`
                  : "Sin datos de clases individuales vs grupales."
              }
            >
              <IndividualVsSharedGlobalChart data={props.individualVsSharedTotals} />
            </SectionCard>
            <SectionCard
              title="Por profesor"
              description="Comparación por profesor a cargo"
              chartSummary={`Comparación individual vs grupal para ${props.individualVsSharedByTeacher.length} profesores.`}
            >
              <IndividualVsSharedByTeacherChart data={props.individualVsSharedByTeacher} />
            </SectionCard>
          </div>
          <SectionCard
            title="Evolución en el tiempo"
            description="Tendencia y proporción"
            chartSummary={`Evolución de clases individuales y grupales (${props.individualVsSharedOverTime.length} períodos).`}
          >
            <IndividualVsSharedOverTimeStackedAreaChart data={props.individualVsSharedOverTime} />
          </SectionCard>
        </div>
      </TabsContent>

      <TabsContent value="alumnos-profesores" className="mt-0 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Análisis y retención de alumnos
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="Activos / Inactivos / Riesgo"
              description="Estado actual de la base de alumnos"
              chartSummary={`Composición de alumnos: ${props.studentsActivity.length} categorías en el gráfico.`}
            >
              <StudentsActivityDonutChart data={props.studentsActivity} />
            </SectionCard>
            <SectionCard
              title="Nuevos alumnos por mes"
              description="Ritmo de adquisición"
              chartSummary={genericCountSummary(
                props.newStudentsByMonth,
                "Sin nuevos alumnos en el período.",
                "altas"
              )}
            >
              <NewStudentsByMonthChart data={props.newStudentsByMonth} />
            </SectionCard>
            <SectionCard
              title="Evolución de alumnos activos"
              description="Comportamiento diario de los últimos 15 días"
              chartSummary={`Evolución diaria de alumnos activos (${props.activeStudentsEvolution.length} días).`}
            >
              <ActiveStudentsEvolutionChart data={props.activeStudentsEvolution} />
            </SectionCard>
          </div>
          {props.studentRankingSlot}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Rendimiento de profesores
          </h3>
          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard
              title="Profesores con más clases"
              description="Total dictadas en el período"
              chartSummary={`Comparación de clases dictadas entre ${props.teachersPerformance.length} profesores.`}
            >
              <TeacherPerformanceBars
                data={props.teachersPerformance}
                metric="classes_count"
                title="Clases"
              />
            </SectionCard>
            <SectionCard
              title="Profesores con más asistencias"
              description="Volumen de alumnos recibidos"
              chartSummary={`Total de asistencias por profesor (${props.teachersPerformance.length} profesores).`}
            >
              <TeacherPerformanceBars
                data={props.teachersPerformance}
                metric="total_attendances"
                title="Asistencias"
              />
            </SectionCard>
            <SectionCard
              title="Promedio por clase"
              description="Alumnos por clase por profesor"
              chartSummary={`Promedio de alumnos por clase para ${props.teachersPerformance.length} profesores.`}
            >
              <TeacherPerformanceBars
                data={props.teachersPerformance}
                metric="avg_per_class"
                title="Prom. por clase"
              />
            </SectionCard>
          </div>
          <SectionCard
            title="Ranking detallado de profesores"
            description="Tabla completa ordenable"
          >
            <TeachersRankingTable data={props.teachersPerformance} />
          </SectionCard>
        </div>
      </TabsContent>

      <TabsContent value="cancelaciones" className="mt-0 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Tendencia de cancelaciones
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="Cancelaciones por mes"
              description="Tendencia global (faltas + cancelaciones por profesor)"
              chartSummary={genericCountSummary(
                props.cancellationsByMonth,
                "Sin cancelaciones por mes en el período.",
                "cancelaciones"
              )}
            >
              <CancellationsByMonthChart data={props.cancellationsByMonth} />
            </SectionCard>
            <SectionCard
              title="Cancelaciones por profesor en el tiempo"
              description="Evolución temporal discriminada"
              chartSummary={`Serie temporal de cancelaciones por profesor (${props.cancellationsByTeacherOverTime.length} puntos de datos).`}
            >
              <CancellationsByTeacherOverTimeChart data={props.cancellationsByTeacherOverTime} />
            </SectionCard>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Rankings de cancelaciones
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="Alumnos que más clases cancelaron"
              description="Faltas registradas (no asistieron)"
              chartSummary={`Ranking de ${props.topStudentsCancellations.length} alumnos con más faltas registradas.`}
            >
              <TopStudentsCancellationsChart data={props.topStudentsCancellations} />
            </SectionCard>
            <SectionCard
              title="Profesores con más cancelaciones"
              description="Clases canceladas por el profesor"
              chartSummary={`Ranking de ${props.teachersCancellationsRanking.length} profesores por clases canceladas.`}
            >
              <TeachersCancellationsChart data={props.teachersCancellationsRanking} />
            </SectionCard>
          </div>
        </div>

        <div className="space-y-4 w-full">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Motivos y orígenes de cancelación
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="Cancelaciones por origen"
              description="Alumno / Profesor / Clima / Otros"
              chartSummary={genericCountSummary(
                props.cancellationsBySource,
                "Sin cancelaciones registradas.",
                "cancelaciones"
              )}
            >
              <CancellationsBySourceDonut data={props.cancellationsBySource} />
            </SectionCard>
            <SectionCard
              title="Motivos de falta de alumnos"
              description="Categorías declaradas"
              chartSummary={genericCountSummary(
                props.cancellationReasons,
                "Sin motivos de cancelación registrados.",
                "faltas con motivo"
              )}
            >
              <CancellationReasonsChart data={props.cancellationReasons} />
            </SectionCard>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Patrones por día y horario
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="Día con más cancelaciones"
              description="Faltas por día de la semana"
              chartSummary={summarizeWeekdayCounts(props.cancellationsByWeekday, "cancelaciones")}
              chartTableHeaders={cancelWeekdayTable.headers}
              chartTableRows={cancelWeekdayTable.rows}
            >
              <CancellationsByWeekdayChart data={props.cancellationsByWeekday} />
            </SectionCard>
            <SectionCard
              title="Horarios con más cancelaciones"
              description="Faltas por franja horaria"
              chartSummary={summarizeTimeSlotCounts(props.cancellationsByTimeSlot, "cancelaciones")}
              chartTableHeaders={cancelTimeTable.headers}
              chartTableRows={cancelTimeTable.rows}
            >
              <CancellationsByTimeSlotChart data={props.cancellationsByTimeSlot} />
            </SectionCard>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

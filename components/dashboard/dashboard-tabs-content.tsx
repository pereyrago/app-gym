"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { BusinessInsights } from "@/components/dashboard/business-insights";
const chartFallback = () => <Skeleton className="h-[280px] w-full rounded-md" />;

const ClassesByDayChart = dynamic(
  () => import("@/components/dashboard/charts/classes-by-day-chart").then((m) => m.ClassesByDayChart),
  { loading: chartFallback }
);
const AttendanceByDayChart = dynamic(
  () => import("@/components/dashboard/charts/attendance-by-day-chart").then((m) => m.AttendanceByDayChart),
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
const StudentsByTeacherChart = dynamic(
  () =>
    import("@/components/dashboard/charts/students-by-teacher-chart").then(
      (m) => m.StudentsByTeacherChart
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
import { CancellationKpisCards } from "@/components/dashboard/cancellation-kpis-cards";
const CancellationReasonsChart = dynamic(
  () =>
    import("@/components/dashboard/charts/cancellation-reasons-chart").then(
      (m) => m.CancellationReasonsChart
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

const DASHBOARD_TABS = ["kpis", "cancelaciones", "asistencias", "insights"] as const;
type DashboardTab = (typeof DASHBOARD_TABS)[number];

function isDashboardTab(value: string | null): value is DashboardTab {
  return value != null && (DASHBOARD_TABS as readonly string[]).includes(value);
}
import type {
  DashboardKpis,
  DayCount,
  WeekdayCount,
  TimeSlotCount,
  TeacherPerformanceRow,
  StudentsByTeacherRow,
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
  CancellationsByMonthRow,
  CancellationsByTeacherOverTimeRow,
  IndividualVsSharedTotalsRow,
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
import {
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  GraduationCap,
  Calendar,
  ClipboardList,
  Layers,
  TrendingUp,
  BarChart3,
  UserMinus,
  ClipboardCheck,
  Lightbulb,
} from "lucide-react";

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
  studentsByTeacher: StudentsByTeacherRow[];
  classTypePerformance: ClassTypePerformanceRow[];
  attendanceByClassTypeOverTime: AttendanceByClassTypeOverTimeRow[];
  topStudentsCancellations: StudentCancellationRow[];
  cancellationsByWeekday: WeekdayCount[];
  cancellationsByTimeSlot: TimeSlotCount[];
  teachersCancellationsRanking: TeacherCancellationRow[];
  cancellationKpis: CancellationKpisRow | null;
  cancellationReasons: CancellationReasonRow[];
  cancellationsByMonth: CancellationsByMonthRow[];
  cancellationsByTeacherOverTime: CancellationsByTeacherOverTimeRow[];
  individualVsSharedOverTime: IndividualVsSharedOverTimeRow[];
  individualVsSharedByTeacher: IndividualVsSharedByTeacherRow[];
  individualVsSharedTotals: IndividualVsSharedTotalsRow | null;
  topTimeSlot: string | null;
  topWeekday: string | null;
  topClassType: string | null;
  topTeacherByAvg: string | null;
};

export function DashboardTabsContent(props: DashboardTabsContentProps) {
  const { kpis, topTimeSlot, topWeekday, topClassType, topTeacherByAvg } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: DashboardTab = isDashboardTab(tabParam) ? tabParam : "kpis";

  const onTabChange = useCallback(
    (value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value === "kpis") next.delete("tab");
      else next.set("tab", value);
      const qs = next.toString();
      router.replace(`/admin/dashboard${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, searchParams]
  );

  const classesByDayTable = dayCountTable(props.classesByDay);
  const attendanceByDayTable = dayCountTable(props.attendanceByDay);
  const attendanceWeekdayTable = weekdayCountTable(props.attendanceByWeekday);
  const attendanceTimeTable = timeSlotCountTable(props.attendanceByTimeSlot);
  const cancelWeekdayTable = weekdayCountTable(props.cancellationsByWeekday);
  const cancelTimeTable = timeSlotCountTable(props.cancellationsByTimeSlot);

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="mb-4 flex w-full flex-wrap gap-1 bg-muted p-1 lg:mb-6">
        <TabsTrigger value="kpis" className="flex items-center gap-1.5">
          <BarChart3 className="h-4 w-4 shrink-0" />
          KPIs
        </TabsTrigger>
        <TabsTrigger value="cancelaciones" className="flex items-center gap-1.5">
          <UserMinus className="h-4 w-4 shrink-0" />
          Cancelaciones y comportamiento
        </TabsTrigger>
        <TabsTrigger value="asistencias" className="flex items-center gap-1.5">
          <ClipboardCheck className="h-4 w-4 shrink-0" />
          Asistencias
        </TabsTrigger>
        <TabsTrigger value="insights" className="flex items-center gap-1.5">
          <Lightbulb className="h-4 w-4 shrink-0" />
          Insights del negocio
        </TabsTrigger>
      </TabsList>

      <TabsContent value="kpis" className="mt-0 space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">KPIs principales</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <KpiCard title="Total alumnos" value={kpis?.total_students ?? 0} icon={Users} />
            <KpiCard
              title="Alumnos activos"
              value={kpis?.active_students ?? 0}
              subtitle="Últimos 15 días"
              icon={UserCheck}
            />
            <KpiCard title="Alumnos inactivos" value={kpis?.inactive_students ?? 0} icon={UserX} />
            <KpiCard
              title="En riesgo de abandono"
              value={kpis?.at_risk_students ?? 0}
              subtitle="Sin asistir 30+ días"
              icon={AlertTriangle}
            />
            <KpiCard
              title="Profesores activos"
              value={kpis?.total_teachers ?? 0}
              icon={GraduationCap}
            />
            <KpiCard title="Clases en período" value={kpis?.total_classes ?? 0} icon={Calendar} />
            <KpiCard
              title="Total asistencias"
              value={kpis?.total_attendances ?? 0}
              icon={ClipboardList}
            />
            <KpiCard
              title="Prom. alumnos por clase"
              value={kpis ? kpis.avg_attendances_per_class.toFixed(1) : "0"}
              icon={TrendingUp}
            />
            <KpiCard title="Tipos de clase" value={kpis?.class_types_count ?? 0} icon={Layers} />
            <KpiCard
              title="Tasa de actividad"
              value={kpis ? `${kpis.activity_rate.toFixed(1)}%` : "0%"}
              subtitle="Activos / total alumnos"
            />
          </div>
        </section>
      </TabsContent>

      <TabsContent value="cancelaciones" className="mt-0 space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">KPIs</h2>
          <CancellationKpisCards data={props.cancellationKpis} />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Tendencia en el tiempo</h2>
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
              description="Multi-línea si hay ≤5 profesores; filtro si hay más"
              chartSummary={`Serie temporal de cancelaciones por profesor (${props.cancellationsByTeacherOverTime.length} puntos de datos).`}
            >
              <CancellationsByTeacherOverTimeChart data={props.cancellationsByTeacherOverTime} />
            </SectionCard>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Rankings</h2>
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
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Motivos de cancelación</h2>
          <SectionCard
            title="Motivos de cancelación (faltas de alumnos)"
            description="Categoría «Otro» mostrada de forma independiente"
            chartSummary={genericCountSummary(
              props.cancellationReasons,
              "Sin motivos de cancelación registrados.",
              "faltas con motivo"
            )}
          >
            <CancellationReasonsChart data={props.cancellationReasons} />
          </SectionCard>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Patrones (día y hora)</h2>
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
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Clases individuales vs grupales
          </h2>
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
              description="Barras agrupadas por profesor"
              chartSummary={`Comparación individual vs grupal para ${props.individualVsSharedByTeacher.length} profesores.`}
            >
              <IndividualVsSharedByTeacherChart data={props.individualVsSharedByTeacher} />
            </SectionCard>
          </div>
          <SectionCard
            title="Evolución en el tiempo"
            description="Tendencia y proporción (área apilada)"
            chartSummary={`Evolución de clases individuales y grupales (${props.individualVsSharedOverTime.length} períodos).`}
          >
            <IndividualVsSharedOverTimeStackedAreaChart data={props.individualVsSharedOverTime} />
          </SectionCard>
        </section>
      </TabsContent>

      <TabsContent value="asistencias" className="mt-0 space-y-6">
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Actividad de clases</h2>
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
              description="Evolución de asistencias"
              chartSummary={summarizeDayCounts(props.attendanceByDay, "asistencias")}
              chartTableHeaders={attendanceByDayTable.headers}
              chartTableRows={attendanceByDayTable.rows}
            >
              <AttendanceByDayChart data={props.attendanceByDay} />
            </SectionCard>
            <SectionCard
              title="Día de la semana con más asistencia"
              description="Patrones semanales"
              chartSummary={summarizeWeekdayCounts(props.attendanceByWeekday, "asistencias")}
              chartTableHeaders={attendanceWeekdayTable.headers}
              chartTableRows={attendanceWeekdayTable.rows}
            >
              <AttendanceByWeekdayChart data={props.attendanceByWeekday} />
            </SectionCard>
            <SectionCard
              title="Franja horaria con más asistencia"
              description="Horas pico"
              chartSummary={summarizeTimeSlotCounts(props.attendanceByTimeSlot, "asistencias")}
              chartTableHeaders={attendanceTimeTable.headers}
              chartTableRows={attendanceTimeTable.rows}
            >
              <AttendanceByTimeSlotChart data={props.attendanceByTimeSlot} />
            </SectionCard>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Análisis de alumnos</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="Activos / Inactivos / Riesgo"
              description="Composición de la base"
              chartSummary={`Composición de alumnos: ${props.studentsActivity.length} categorías en el gráfico.`}
            >
              <StudentsActivityDonutChart data={props.studentsActivity} />
            </SectionCard>
            <SectionCard
              title="Nuevos alumnos por mes"
              description="Adquisición"
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
              description="Últimos 15 días por día"
              chartSummary={`Evolución diaria de alumnos activos (${props.activeStudentsEvolution.length} días).`}
            >
              <ActiveStudentsEvolutionChart data={props.activeStudentsEvolution} />
            </SectionCard>
            <SectionCard
              title="Distribución de alumnos por profesor"
              chartSummary={`Distribución entre ${props.studentsByTeacher.length} profesores.`}
            >
              <StudentsByTeacherChart data={props.studentsByTeacher} />
            </SectionCard>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Rendimiento de profesores</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard
              title="Profesores con más clases"
              description="En el período"
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
              chartSummary={`Total de asistencias por profesor (${props.teachersPerformance.length} profesores).`}
            >
              <TeacherPerformanceBars
                data={props.teachersPerformance}
                metric="total_attendances"
                title="Asistencias"
              />
            </SectionCard>
            <SectionCard
              title="Promedio de alumnos por clase por profesor"
              chartSummary={`Promedio de alumnos por clase para ${props.teachersPerformance.length} profesores.`}
            >
              <TeacherPerformanceBars
                data={props.teachersPerformance}
                metric="avg_per_class"
                title="Prom. por clase"
              />
            </SectionCard>
          </div>
          <SectionCard title="Ranking detallado" description="Ordenable por columnas">
            <TeachersRankingTable data={props.teachersPerformance} />
          </SectionCard>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Análisis por tipo de clase</h2>
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
            description="Área apilada por tipo de clase"
            chartSummary={`Serie temporal de asistencias por tipo (${props.attendanceByClassTypeOverTime.length} registros).`}
          >
            <AttendanceByClassTypeStackedChart data={props.attendanceByClassTypeOverTime} />
          </SectionCard>
        </section>
      </TabsContent>

      <TabsContent value="insights" className="mt-0">
        <BusinessInsights
          kpis={kpis}
          topTimeSlot={topTimeSlot}
          topWeekday={topWeekday}
          topClassType={topClassType}
          topTeacherByAvg={topTeacherByAvg}
        />
      </TabsContent>
    </Tabs>
  );
}

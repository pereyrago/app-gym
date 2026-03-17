"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { SectionCard } from "@/components/dashboard/section-card";
import { BusinessInsights } from "@/components/dashboard/business-insights";
import { ClassesByDayChart } from "@/components/dashboard/charts/classes-by-day-chart";
import { AttendanceByDayChart } from "@/components/dashboard/charts/attendance-by-day-chart";
import { AttendanceByWeekdayChart } from "@/components/dashboard/charts/attendance-by-weekday-chart";
import { AttendanceByTimeSlotChart } from "@/components/dashboard/charts/attendance-by-time-slot-chart";
import { StudentsActivityDonutChart } from "@/components/dashboard/charts/students-activity-donut-chart";
import { NewStudentsByMonthChart } from "@/components/dashboard/charts/new-students-by-month-chart";
import { ActiveStudentsEvolutionChart } from "@/components/dashboard/charts/active-students-evolution-chart";
import { StudentsByTeacherChart } from "@/components/dashboard/charts/students-by-teacher-chart";
import { TeacherPerformanceBars } from "@/components/dashboard/charts/teacher-performance-bars";
import { TeachersRankingTable } from "@/components/dashboard/teachers-ranking-table";
import { ClassTypePerformanceChart } from "@/components/dashboard/charts/class-type-performance-chart";
import { ClassTypeDistributionDonut } from "@/components/dashboard/charts/class-type-distribution-donut";
import { AttendanceByClassTypeStackedChart } from "@/components/dashboard/charts/attendance-by-class-type-stacked-chart";
import { CancellationsByWeekdayChart } from "@/components/dashboard/charts/cancellations-by-weekday-chart";
import { CancellationsByTimeSlotChart } from "@/components/dashboard/charts/cancellations-by-time-slot-chart";
import { TopStudentsCancellationsChart } from "@/components/dashboard/charts/top-students-cancellations-chart";
import { TeachersCancellationsChart } from "@/components/dashboard/charts/teachers-cancellations-chart";
import { CancellationKpisCards } from "@/components/dashboard/cancellation-kpis-cards";
import { CancellationReasonsChart } from "@/components/dashboard/charts/cancellation-reasons-chart";
import { CancellationsByMonthChart } from "@/components/dashboard/charts/cancellations-by-month-chart";
import { CancellationsByTeacherOverTimeChart } from "@/components/dashboard/charts/cancellations-by-teacher-over-time-chart";
import {
  IndividualVsSharedOverTimeStackedAreaChart,
  IndividualVsSharedByTeacherChart,
} from "@/components/dashboard/charts/individual-vs-shared-chart";
import { IndividualVsSharedGlobalChart } from "@/components/dashboard/charts/individual-vs-shared-global-chart";
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

  return (
    <Tabs defaultValue="kpis" className="w-full">
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
            >
              <CancellationsByMonthChart data={props.cancellationsByMonth} />
            </SectionCard>
            <SectionCard
              title="Cancelaciones por profesor en el tiempo"
              description="Multi-línea si hay ≤5 profesores; filtro si hay más"
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
            >
              <TopStudentsCancellationsChart data={props.topStudentsCancellations} />
            </SectionCard>
            <SectionCard
              title="Profesores con más cancelaciones"
              description="Clases canceladas por el profesor"
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
            >
              <CancellationsByWeekdayChart data={props.cancellationsByWeekday} />
            </SectionCard>
            <SectionCard
              title="Horarios con más cancelaciones"
              description="Faltas por franja horaria"
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
            >
              <IndividualVsSharedGlobalChart data={props.individualVsSharedTotals} />
            </SectionCard>
            <SectionCard title="Por profesor" description="Barras agrupadas por profesor">
              <IndividualVsSharedByTeacherChart data={props.individualVsSharedByTeacher} />
            </SectionCard>
          </div>
          <SectionCard
            title="Evolución en el tiempo"
            description="Tendencia y proporción (área apilada)"
          >
            <IndividualVsSharedOverTimeStackedAreaChart data={props.individualVsSharedOverTime} />
          </SectionCard>
        </section>
      </TabsContent>

      <TabsContent value="asistencias" className="mt-0 space-y-6">
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Actividad de clases</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Clases por día" description="Evolución de clases dictadas">
              <ClassesByDayChart data={props.classesByDay} />
            </SectionCard>
            <SectionCard title="Asistencias por día" description="Evolución de asistencias">
              <AttendanceByDayChart data={props.attendanceByDay} />
            </SectionCard>
            <SectionCard
              title="Día de la semana con más asistencia"
              description="Patrones semanales"
            >
              <AttendanceByWeekdayChart data={props.attendanceByWeekday} />
            </SectionCard>
            <SectionCard title="Franja horaria con más asistencia" description="Horas pico">
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
            >
              <StudentsActivityDonutChart data={props.studentsActivity} />
            </SectionCard>
            <SectionCard title="Nuevos alumnos por mes" description="Adquisición">
              <NewStudentsByMonthChart data={props.newStudentsByMonth} />
            </SectionCard>
            <SectionCard title="Evolución de alumnos activos" description="Últimos 15 días por día">
              <ActiveStudentsEvolutionChart data={props.activeStudentsEvolution} />
            </SectionCard>
            <SectionCard title="Distribución de alumnos por profesor">
              <StudentsByTeacherChart data={props.studentsByTeacher} />
            </SectionCard>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Rendimiento de profesores</h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <SectionCard title="Profesores con más clases" description="En el período">
              <TeacherPerformanceBars
                data={props.teachersPerformance}
                metric="classes_count"
                title="Clases"
              />
            </SectionCard>
            <SectionCard title="Profesores con más asistencias">
              <TeacherPerformanceBars
                data={props.teachersPerformance}
                metric="total_attendances"
                title="Asistencias"
              />
            </SectionCard>
            <SectionCard title="Promedio de alumnos por clase por profesor">
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
            <SectionCard title="Tipo de clase con más asistencia">
              <ClassTypePerformanceChart data={props.classTypePerformance} />
            </SectionCard>
            <SectionCard title="Distribución de clases por tipo">
              <ClassTypeDistributionDonut data={props.classTypePerformance} />
            </SectionCard>
          </div>
          <SectionCard
            title="Evolución de asistencia por tipo"
            description="Área apilada por tipo de clase"
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

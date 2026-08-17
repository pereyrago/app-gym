"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import type { ExecutiveKpiMetric, ExecutiveSummaryKpis } from "@/features/dashboard/types";
import { Users, UserPlus, BarChart3, Clock, XCircle, CheckCircle2 } from "lucide-react";

type ExecutiveSummaryKpisProps = {
  data: ExecutiveSummaryKpis | null;
  emptyMessage?: string;
};

function trendFromVariation(variationPct: number, invert = false): "up" | "down" | "neutral" {
  if (variationPct === 0) return "neutral";
  const isUp = variationPct > 0;
  if (invert) return isUp ? "down" : "up";
  return isUp ? "up" : "down";
}

function trendLabel(m: ExecutiveKpiMetric): string | undefined {
  if (m.variationPct === 0) return undefined;
  return `${m.variationPct > 0 ? "+" : ""}${m.variationPct}% vs mes ant.`;
}

export function ExecutiveSummaryKpisSection({
  data,
  emptyMessage = "Sin datos",
}: ExecutiveSummaryKpisProps) {
  if (!data) {
    return (
      <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const cancellationPctSubtitle =
    data.classes.current > 0
      ? `${((data.cancellations.current / data.classes.current) * 100).toFixed(1)}% del total`
      : undefined;

  return (
    <section aria-label="KPIs del período">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          title="Alumnos activos"
          value={data.activeStudents.current}
          trend={trendFromVariation(data.activeStudents.variationPct)}
          trendLabel={trendLabel(data.activeStudents)}
          icon={Users}
          iconCircle="bg-indigo-600 text-white dark:bg-indigo-500/25 dark:text-indigo-300"
        />
        <KpiCard
          title="Nuevos alumnos"
          value={data.newStudents.current}
          trend={trendFromVariation(data.newStudents.variationPct)}
          trendLabel={trendLabel(data.newStudents)}
          icon={UserPlus}
          iconCircle="bg-emerald-600 text-white dark:bg-emerald-500/25 dark:text-emerald-300"
        />
        <KpiCard
          title="Clases realizadas"
          value={data.classes.current}
          trend={trendFromVariation(data.classes.variationPct)}
          trendLabel={trendLabel(data.classes)}
          icon={BarChart3}
          iconCircle="bg-blue-600 text-white dark:bg-blue-500/25 dark:text-blue-300"
        />
        <KpiCard
          title="Horas trabajadas"
          value={data.hours.current.toFixed(0)}
          trend={trendFromVariation(data.hours.variationPct)}
          trendLabel={trendLabel(data.hours)}
          icon={Clock}
          iconCircle="bg-amber-500 text-white dark:bg-amber-500/25 dark:text-amber-300"
        />
        <KpiCard
          title="Cancelaciones"
          value={data.cancellations.current}
          subtitle={cancellationPctSubtitle}
          trend={trendFromVariation(data.cancellations.variationPct, true)}
          trendLabel={trendLabel(data.cancellations)}
          icon={XCircle}
          iconCircle="bg-rose-600 text-white dark:bg-rose-500/25 dark:text-rose-300"
        />
        <KpiCard
          title="Asistencia"
          value={`${data.attendanceRatePct.current.toFixed(1)}%`}
          trend={trendFromVariation(data.attendanceRatePct.variationPct)}
          trendLabel={trendLabel(data.attendanceRatePct)}
          icon={CheckCircle2}
          iconCircle="bg-sky-600 text-white dark:bg-sky-500/25 dark:text-sky-300"
        />
      </div>
    </section>
  );
}

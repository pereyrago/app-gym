"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import type { ExecutiveKpiMetric, ExecutiveSummaryKpis } from "@/features/dashboard/types";
import { Users, UserPlus, Calendar, Clock, XCircle, CheckCircle2, Star } from "lucide-react";

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
      <div className="flex flex-wrap gap-3">
        <KpiCard
          title="Alumnos activos"
          value={data.activeStudents.current}
          trend={trendFromVariation(data.activeStudents.variationPct)}
          trendLabel={trendLabel(data.activeStudents)}
          icon={Users}
          iconCircle="bg-violet-500/20 text-violet-400"
          className="min-w-[160px] flex-1"
        />
        <KpiCard
          title="Nuevos alumnos"
          value={data.newStudents.current}
          trend={trendFromVariation(data.newStudents.variationPct)}
          trendLabel={trendLabel(data.newStudents)}
          icon={UserPlus}
          iconCircle="bg-emerald-500/20 text-emerald-400"
          className="min-w-[160px] flex-1"
        />
        <KpiCard
          title="Clases realizadas"
          value={data.classes.current}
          trend={trendFromVariation(data.classes.variationPct)}
          trendLabel={trendLabel(data.classes)}
          icon={Calendar}
          iconCircle="bg-blue-500/20 text-blue-400"
          className="min-w-[160px] flex-1"
        />
        <KpiCard
          title="Horas trabajadas"
          value={data.hours.current.toFixed(0)}
          trend={trendFromVariation(data.hours.variationPct)}
          trendLabel={trendLabel(data.hours)}
          icon={Clock}
          iconCircle="bg-amber-500/20 text-amber-400"
          className="min-w-[160px] flex-1"
        />
        <KpiCard
          title="Cancelaciones"
          value={data.cancellations.current}
          subtitle={cancellationPctSubtitle}
          trend={trendFromVariation(data.cancellations.variationPct, true)}
          trendLabel={trendLabel(data.cancellations)}
          icon={XCircle}
          iconCircle="bg-red-500/20 text-red-400"
          className="min-w-[160px] flex-1"
        />
        <KpiCard
          title="Asistencia"
          value={`${data.attendanceRatePct.current.toFixed(1)}%`}
          trend={trendFromVariation(data.attendanceRatePct.variationPct)}
          trendLabel={trendLabel(data.attendanceRatePct)}
          icon={CheckCircle2}
          iconCircle="bg-sky-500/20 text-sky-400"
          className="min-w-[160px] flex-1"
        />
        {/* Satisfacción — placeholder sin dato real */}
        <KpiCard
          title="Satisfacción"
          value="—"
          subtitle="Próximamente"
          icon={Star}
          iconCircle="bg-yellow-500/20 text-yellow-400"
          className="min-w-[160px] flex-1 opacity-60"
        />
      </div>
    </section>
  );
}

"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import type { ExecutiveKpiMetric, ExecutiveSummaryKpis } from "@/features/dashboard/types";
import {
  UserCheck,
  Calendar,
  GraduationCap,
  CalendarX,
  Clock,
  Percent,
  UserPlus,
} from "lucide-react";

type ExecutiveSummaryKpisProps = {
  data: ExecutiveSummaryKpis | null;
  emptyMessage?: string;
};

function trendFromVariation(variationPct: number, invert = false): "up" | "down" | "neutral" {
  if (variationPct === 0) return "neutral";
  const isUp = variationPct > 0;
  if (invert) return isUp ? "down" : "up"; // para cancelaciones: más = malo
  return isUp ? "up" : "down";
}

function trendLabel(m: ExecutiveKpiMetric): string | undefined {
  if (m.variationPct === 0) return undefined;
  return `${m.variationPct > 0 ? "+" : ""}${m.variationPct}% vs período anterior`;
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

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Resumen Ejecutivo</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          title="Alumnos activos"
          value={data.activeStudents.current}
          trend={trendFromVariation(data.activeStudents.variationPct)}
          trendLabel={trendLabel(data.activeStudents)}
          icon={UserCheck}
        />
        <KpiCard
          title="Clases"
          value={data.classes.current}
          trend={trendFromVariation(data.classes.variationPct)}
          trendLabel={trendLabel(data.classes)}
          icon={Calendar}
        />
        <KpiCard
          title="Profesores"
          value={data.teachers.current}
          trend={trendFromVariation(data.teachers.variationPct)}
          trendLabel={trendLabel(data.teachers)}
          icon={GraduationCap}
        />
        <KpiCard
          title="Cancelaciones"
          value={data.cancellations.current}
          trend={trendFromVariation(data.cancellations.variationPct, true)}
          trendLabel={trendLabel(data.cancellations)}
          icon={CalendarX}
        />
        <KpiCard
          title="Horas"
          value={data.hours.current.toFixed(1)}
          trend={trendFromVariation(data.hours.variationPct)}
          trendLabel={trendLabel(data.hours)}
          icon={Clock}
        />
        <KpiCard
          title="Asistencia"
          value={`${data.attendanceRatePct.current.toFixed(1)}%`}
          trend={trendFromVariation(data.attendanceRatePct.variationPct)}
          trendLabel={trendLabel(data.attendanceRatePct)}
          icon={Percent}
        />
        <KpiCard
          title="Nuevos alumnos"
          value={data.newStudents.current}
          trend={trendFromVariation(data.newStudents.variationPct)}
          trendLabel={trendLabel(data.newStudents)}
          icon={UserPlus}
        />
      </div>
    </section>
  );
}

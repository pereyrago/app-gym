"use client";

import { KpiCard } from "@/components/dashboard/kpi-card";
import type { CancellationKpisRow } from "@/features/dashboard/types";
import { CalendarX, Percent, TrendingDown, TrendingUp, Users, GraduationCap } from "lucide-react";

type CancellationKpisCardsProps = {
  data: CancellationKpisRow | null;
  emptyMessage?: string;
};

function trendFromVariation(variationPct: number): "up" | "down" | "neutral" {
  if (variationPct > 0) return "up"; // más cancelaciones = malo
  if (variationPct < 0) return "down";
  return "neutral";
}

export function CancellationKpisCards({
  data,
  emptyMessage = "Sin datos",
}: CancellationKpisCardsProps) {
  if (!data) {
    return (
      <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const trend = trendFromVariation(data.variation_pct);
  const trendLabel =
    data.previous_period_cancellations != null && data.variation_pct !== 0
      ? `vs período anterior: ${data.variation_pct > 0 ? "+" : ""}${data.variation_pct}%`
      : undefined;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <KpiCard
        title="Total cancelaciones"
        value={data.total_cancellations}
        subtitle="Faltas + cancelaciones por profesor"
        icon={CalendarX}
      />
      <KpiCard
        title="Tasa de cancelación"
        value={`${data.cancellation_rate_pct}%`}
        subtitle="Sobre total de clases en período"
        icon={Percent}
      />
      <KpiCard
        title="Variación vs período anterior"
        value={
          data.variation_pct !== 0
            ? `${data.variation_pct > 0 ? "+" : ""}${data.variation_pct}%`
            : "0%"
        }
        trend={trend}
        trendLabel={trendLabel}
        icon={trend === "down" ? TrendingDown : trend === "up" ? TrendingUp : Percent}
      />
      <KpiCard
        title="Prom. cancelaciones por profesor"
        value={data.avg_per_teacher.toFixed(1)}
        icon={GraduationCap}
      />
      <KpiCard
        title="Prom. cancelaciones por alumno"
        value={data.avg_per_student.toFixed(1)}
        subtitle="Solo alumnos con al menos una falta"
        icon={Users}
      />
    </div>
  );
}

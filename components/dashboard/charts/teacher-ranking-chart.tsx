"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { TeacherRankingRow } from "@/features/dashboard/types";

type MetricKey =
  "classes_count" | "hours" | "unique_students" | "cancellations_count" | "attendance_pct";

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "classes_count", label: "Clases" },
  { key: "hours", label: "Horas" },
  { key: "unique_students", label: "Alumnos" },
  { key: "cancellations_count", label: "Cancelaciones" },
  { key: "attendance_pct", label: "Asistencia %" },
];

type TeacherRankingChartProps = {
  data: TeacherRankingRow[];
  emptyMessage?: string;
};

export function TeacherRankingChart({
  data,
  emptyMessage = "Sin datos",
}: TeacherRankingChartProps) {
  const [metric, setMetric] = useState<MetricKey>("classes_count");

  const activeMetric = METRICS.find((m) => m.key === metric) ?? METRICS[0]!;

  const sorted = useMemo(
    () => [...data].sort((a, b) => b[activeMetric.key] - a[activeMetric.key]),
    [data, activeMetric.key]
  );

  const max = sorted[0]?.[activeMetric.key] ?? 1;

  const formatValue = (row: TeacherRankingRow) => {
    const v = row[activeMetric.key];
    if (activeMetric.key === "attendance_pct") return `${v}%`;
    if (activeMetric.key === "hours") return v.toFixed(1);
    return String(v);
  };

  if (!data.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Selector de métrica — pills compactos */}
      <div className="flex flex-wrap gap-1" role="group" aria-label="Métrica de ranking">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMetric(m.key)}
            className={cn(
              "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
              metric === m.key
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={metric === m.key}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Tabla compacta */}
      <div className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-[1.5rem_1fr_auto] gap-x-2 px-1">
          <span className="text-[11px] text-muted-foreground">#</span>
          <span className="text-[11px] text-muted-foreground">Profesor</span>
          <span className="text-[11px] text-muted-foreground">{activeMetric.label}</span>
        </div>

        {/* Filas */}
        {sorted.map((row) => {
          const rank = sorted.indexOf(row) + 1;
          const widthPct = max > 0 ? Math.round((row[activeMetric.key] / max) * 100) : 0;
          return (
            <div
              key={row.teacher_id}
              className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-x-2 px-1"
            >
              {/* Rank */}
              <span className="text-[12px] font-medium tabular-nums text-muted-foreground">
                {rank}
              </span>

              {/* Nombre + barra */}
              <div className="min-w-0 space-y-0.5">
                <p className="truncate text-[13px] font-medium capitalize leading-none">
                  {row.teacher_name}
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${widthPct}%` }}
                    aria-hidden
                  />
                </div>
              </div>

              {/* Valor */}
              <span className="text-[13px] font-semibold tabular-nums">{formatValue(row)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

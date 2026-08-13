"use client";

import type { CancellationReasonRow } from "@/features/dashboard/types";

// Colores de barra por posición, igual al mockup (rojo → naranja → amarillo → azul → verde)
const BAR_COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];

type CancellationReasonsChartProps = {
  data: CancellationReasonRow[];
  emptyMessage?: string;
  /** Cuántos motivos mostrar. Default: 5 */
  topN?: number;
};

export function CancellationReasonsChart({
  data,
  emptyMessage = "Sin datos",
  topN = 5,
}: CancellationReasonsChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[160px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.count - a.count).slice(0, topN);
  const max = sorted[0]?.count ?? 1;

  return (
    <ul className="space-y-3" aria-label="Motivos de cancelación">
      {sorted.map((row, i) => {
        const widthPct = max > 0 ? Math.round((row.count / max) * 100) : 0;
        const barColor = BAR_COLORS[i % BAR_COLORS.length] ?? "bg-muted-foreground";

        return (
          <li key={row.reason_key} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-medium leading-none">{row.reason_label}</span>
              <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground">
                {row.count}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
              <div
                className={`h-full rounded-full ${barColor} transition-all`}
                style={{ width: `${widthPct}%` }}
                role="presentation"
                aria-label={`${widthPct}%`}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

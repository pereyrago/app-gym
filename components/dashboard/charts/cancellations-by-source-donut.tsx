"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { CancellationSourceRow } from "@/features/dashboard/types";

type CancellationsBySourceDonutProps = {
  data: CancellationSourceRow[];
  emptyMessage?: string;
};

const SOURCE_ORDER: CancellationSourceRow["source"][] = ["alumno", "profesor", "clima", "otros"];

const SOURCE_CONFIG: Record<
  CancellationSourceRow["source"],
  { label: string; color: string; dotClass: string }
> = {
  alumno: { label: "Alumno", color: "#22c55e", dotClass: "bg-green-500" },
  profesor: { label: "Profesor", color: "#f97316", dotClass: "bg-orange-500" },
  clima: { label: "Clima", color: "#eab308", dotClass: "bg-yellow-500" },
  otros: { label: "Otros", color: "#6b7280", dotClass: "bg-gray-500" },
};

export function CancellationsBySourceDonut({
  data,
  emptyMessage = "Sin datos",
}: CancellationsBySourceDonutProps) {
  const counts = new Map(data.map((r) => [r.source, r.count]));
  const total = data.reduce((s, r) => s + r.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const chartData = SOURCE_ORDER.map((source) => ({
    source,
    name: SOURCE_CONFIG[source].label,
    value: counts.get(source) ?? 0,
    color: SOURCE_CONFIG[source].color,
  })).filter((d) => d.value > 0);

  return (
    <div className="flex items-center gap-4">
      {/* Dona con total en el centro */}
      <div className="relative shrink-0">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={74}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((d) => (
                <Cell key={d.source} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                fontSize: 12,
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
              }}
              formatter={(value: number, name: string) => [
                `${value} (${Math.round((value / total) * 100)}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Total en el centro */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
          aria-hidden
        >
          <span className="text-2xl font-bold tabular-nums leading-none">{total}</span>
          <span className="text-[11px] text-muted-foreground">Total</span>
        </div>
      </div>

      {/* Leyenda custom */}
      <ul className="flex flex-col gap-2" aria-label="Distribución de cancelaciones por origen">
        {chartData.map((d) => {
          const pct = Math.round((d.value / total) * 100);
          return (
            <li key={d.source} className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
                aria-hidden
              />
              <span className="text-[13px] text-foreground">{d.name}</span>
              <span className="ml-auto text-[13px] text-muted-foreground tabular-nums">
                {pct}% ({d.value})
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

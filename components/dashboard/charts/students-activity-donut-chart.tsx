"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { StudentsActivityRow } from "@/features/dashboard/types";

// Paleta fija que coincide con el mockup: verde / ámbar / rojo
const STATUS_CONFIG: Record<string, { label: string; short: string; color: string }> = {
  active: { label: "Activos", short: "Activos", color: "#22c55e" },
  at_risk: { label: "En riesgo", short: "En riesgo", color: "#f59e0b" },
  inactive: { label: "Inactivos", short: "Inactivos", color: "#ef4444" },
};

// Orden fijo para que la dona sea consistente
const STATUS_ORDER = ["active", "at_risk", "inactive"];

type StudentsActivityDonutChartProps = {
  data: StudentsActivityRow[];
  emptyMessage?: string;
};

export function StudentsActivityDonutChart({
  data,
  emptyMessage = "Sin datos",
}: StudentsActivityDonutChartProps) {
  const total = data.reduce((s, r) => s + r.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const countByStatus = new Map(data.map((r) => [r.status, r.count]));

  const chartData = STATUS_ORDER.map((status) => {
    const cfg = STATUS_CONFIG[status] ?? { label: status, short: status, color: "#6b7280" };
    return {
      status,
      name: cfg.label,
      short: cfg.short,
      value: countByStatus.get(status) ?? 0,
      color: cfg.color,
    };
  }).filter((d) => d.value > 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-3 w-full py-1">
      {/* Dona con total en el centro */}
      <div className="relative shrink-0">
        <ResponsiveContainer width={136} height={136}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={64}
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((d) => (
                <Cell key={d.status} fill={d.color} />
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
          <span className="text-xl font-bold tabular-nums leading-none">{total}</span>
          <span className="text-[10px] text-muted-foreground">Total</span>
        </div>
      </div>

      {/* Leyenda custom */}
      <ul className="flex flex-col gap-1.5 flex-1 min-w-0" aria-label="Estado de alumnos">
        {chartData.map((d) => {
          const pct = Math.round((d.value / total) * 100);
          return (
            <li key={d.status} className="flex items-center gap-1.5 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: d.color }}
                aria-hidden
              />
              <span className="truncate text-foreground font-medium">{d.short}</span>
              <span className="ml-auto shrink-0 text-muted-foreground tabular-nums font-medium">
                {d.value} ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

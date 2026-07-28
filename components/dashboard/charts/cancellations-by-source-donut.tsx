"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { CancellationSourceRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

type CancellationsBySourceDonutProps = {
  data: CancellationSourceRow[];
  emptyMessage?: string;
};

const SOURCE_ORDER: CancellationSourceRow["source"][] = ["alumno", "profesor", "clima", "otros"];
const SOURCE_LABELS: Record<CancellationSourceRow["source"], string> = {
  alumno: "Alumno",
  profesor: "Profesor",
  clima: "Clima",
  otros: "Otros",
};

/** Dona de 4 categorías (Bloque 5); "otros" se sintetiza en 0 si el backend no lo devuelve. */
export function CancellationsBySourceDonut({
  data,
  emptyMessage = "Sin datos",
}: CancellationsBySourceDonutProps) {
  const colors = useChartColors();
  const palette = [colors.chart1, colors.chart2, colors.chart4, colors.border];
  const counts = new Map(data.map((r) => [r.source, r.count]));
  const total = data.reduce((s, r) => s + r.count, 0);

  if (total === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const chartData = SOURCE_ORDER.map((source) => ({
    name: SOURCE_LABELS[source],
    value: counts.get(source) ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} />
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
            `${value} (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
            name,
          ]}
        />
        <Legend fontSize={12} />
      </PieChart>
    </ResponsiveContainer>
  );
}

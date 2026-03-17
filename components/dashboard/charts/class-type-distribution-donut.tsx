"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ClassTypePerformanceRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

type ClassTypeDistributionDonutProps = {
  data: ClassTypePerformanceRow[];
  emptyMessage?: string;
};

const CHART_KEYS = ["chart1", "chart2", "chart3", "chart4", "chart5"] as const;

export function ClassTypeDistributionDonut({
  data,
  emptyMessage = "Sin datos",
}: ClassTypeDistributionDonutProps) {
  const colors = useChartColors();
  const palette = CHART_KEYS.map((k) => colors[k]);
  const total = data.reduce((s, r) => s + r.classes_count, 0);
  if (total === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const chartData = data.map((r) => ({ name: r.class_type_name, value: r.classes_count }));

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
          formatter={(value: number) => [value, "Clases"]}
        />
        <Legend fontSize={12} />
      </PieChart>
    </ResponsiveContainer>
  );
}

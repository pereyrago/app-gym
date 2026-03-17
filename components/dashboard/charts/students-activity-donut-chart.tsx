"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { StudentsActivityRow } from "@/features/dashboard/types";
import { ACTIVITY_STATUS_LABELS } from "@/features/dashboard/constants";
import { useChartColors } from "@/hooks/use-chart-colors";

type StudentsActivityDonutChartProps = {
  data: StudentsActivityRow[];
  emptyMessage?: string;
};

export function StudentsActivityDonutChart({
  data,
  emptyMessage = "Sin datos",
}: StudentsActivityDonutChartProps) {
  const colors = useChartColors();
  const palette = [colors.chart1, colors.chart2, colors.chart3];
  const total = data.reduce((s, r) => s + r.count, 0);
  if (total === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const chartData = data.map((r) => ({
    name: ACTIVITY_STATUS_LABELS[r.status] ?? r.status,
    value: r.count,
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
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend fontSize={12} />
      </PieChart>
    </ResponsiveContainer>
  );
}

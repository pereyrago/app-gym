"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TeacherPerformanceRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

type TeacherPerformanceBarsProps = {
  data: TeacherPerformanceRow[];
  metric: "classes_count" | "total_attendances" | "avg_per_class";
  title: string;
  emptyMessage?: string;
};

export function TeacherPerformanceBars({
  data,
  metric,
  title,
  emptyMessage = "Sin datos",
}: TeacherPerformanceBarsProps) {
  const colors = useChartColors();
  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
        <YAxis
          type="category"
          dataKey="teacher_name"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={100}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            backgroundColor: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
          }}
          cursor={{ fill: colors.chartHover }}
          formatter={(value: number) => [value, title]}
        />
        <Bar dataKey={metric} name={title} fill={colors.secondary} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { TeacherCancellationRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

const CANCELLATION_FILL = "hsl(0, 72%, 51%)"; // red

type TeachersCancellationsChartProps = {
  data: TeacherCancellationRow[];
  emptyMessage?: string;
};

export function TeachersCancellationsChart({
  data,
  emptyMessage = "Sin datos",
}: TeachersCancellationsChartProps) {
  const colors = useChartColors();
  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
        <YAxis
          type="category"
          dataKey="teacher_name"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            backgroundColor: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
          }}
          cursor={{ fill: colors.chartHover }}
          formatter={(value: number) => [value, "Clases canceladas"]}
        />
        <Bar
          dataKey="cancellation_count"
          name="Clases canceladas"
          fill={CANCELLATION_FILL}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

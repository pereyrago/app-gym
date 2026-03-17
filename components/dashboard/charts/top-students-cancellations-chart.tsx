"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { StudentCancellationRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

const CANCELLATION_FILL = "hsl(25, 95%, 53%)";

type TopStudentsCancellationsChartProps = {
  data: StudentCancellationRow[];
  emptyMessage?: string;
};

export function TopStudentsCancellationsChart({
  data,
  emptyMessage = "Sin datos",
}: TopStudentsCancellationsChartProps) {
  const colors = useChartColors();
  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    name: d.student_name
      ? `${d.student_name.charAt(0).toUpperCase()}${d.student_name.slice(1).toLowerCase()}`
      : "Alumno",
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
        <YAxis
          type="category"
          dataKey="name"
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
          formatter={(value: number) => [value, "Cancelaciones"]}
        />
        <Bar
          dataKey="cancellation_count"
          name="Cancelaciones"
          fill={CANCELLATION_FILL}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

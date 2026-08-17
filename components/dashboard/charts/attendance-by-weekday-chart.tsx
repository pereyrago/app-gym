"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { WeekdayCount } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

type AttendanceByWeekdayChartProps = {
  data: WeekdayCount[];
  emptyMessage?: string;
};

export function AttendanceByWeekdayChart({
  data,
  emptyMessage = "Sin datos",
}: AttendanceByWeekdayChartProps) {
  const colors = useChartColors();
  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
        <XAxis
          dataKey="weekday_name"
          tick={{ fontSize: 10 }}
          tickLine={false}
          tickFormatter={(v: string) => (v ? v.slice(0, 3) : "")}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={24}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            backgroundColor: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
          }}
          cursor={{ fill: colors.chartHover }}
          formatter={(value: number) => [value, "Asistencias"]}
        />
        <Bar dataKey="count" name="Asistencias" fill={colors.secondary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { WeekdayCount } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

const CANCELLATION_FILL = "hsl(25, 95%, 53%)";

type CancellationsByWeekdayChartProps = {
  data: WeekdayCount[];
  emptyMessage?: string;
};

export function CancellationsByWeekdayChart({
  data,
  emptyMessage = "Sin datos",
}: CancellationsByWeekdayChartProps) {
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
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
        <XAxis dataKey="weekday_name" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={28}
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
        <Bar dataKey="count" name="Cancelaciones" fill={CANCELLATION_FILL} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

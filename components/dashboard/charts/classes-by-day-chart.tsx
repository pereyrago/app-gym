"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { DayCount } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

type ClassesByDayChartProps = {
  data: DayCount[];
  emptyMessage?: string;
};

export function ClassesByDayChart({ data, emptyMessage = "Sin datos" }: ClassesByDayChartProps) {
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
    dateLabel: format(parseISO(d.day), "d MMM", { locale: es }),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
        <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} tickLine={false} />
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
          labelFormatter={(_, payload) =>
            payload?.[0]?.payload?.day
              ? format(parseISO(payload[0].payload.day), "EEEE d MMMM", { locale: es })
              : ""
          }
          formatter={(value: number) => [value, "Clases"]}
        />
        <Line
          type="monotone"
          dataKey="count"
          name="Clases"
          stroke={colors.secondary}
          strokeWidth={2}
          dot={{ r: 3, fill: colors.secondary }}
          activeDot={{ r: 4, fill: colors.secondary }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

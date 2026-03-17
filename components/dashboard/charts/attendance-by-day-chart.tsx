"use client";

import {
  AreaChart,
  Area,
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

type AttendanceByDayChartProps = {
  data: DayCount[];
  emptyMessage?: string;
};

export function AttendanceByDayChart({
  data,
  emptyMessage = "Sin datos",
}: AttendanceByDayChartProps) {
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
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="attendanceByDayGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={colors.secondary} stopOpacity={0.4} />
            <stop offset="95%" stopColor={colors.secondary} stopOpacity={0} />
          </linearGradient>
        </defs>
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
          formatter={(value: number) => [value, "Asistencias"]}
        />
        <Area
          type="monotone"
          dataKey="count"
          name="Asistencias"
          stroke={colors.secondary}
          fill="url(#attendanceByDayGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

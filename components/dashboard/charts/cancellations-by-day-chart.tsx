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

const CANCELLATION_FILL = "hsl(25, 95%, 53%)"; // amber

type CancellationsByDayChartProps = {
  data: DayCount[];
  emptyMessage?: string;
};

export function CancellationsByDayChart({
  data,
  emptyMessage = "Sin datos",
}: CancellationsByDayChartProps) {
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
          <linearGradient id="cancellationsByDayGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CANCELLATION_FILL} stopOpacity={0.4} />
            <stop offset="95%" stopColor={CANCELLATION_FILL} stopOpacity={0} />
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
          formatter={(value: number) => [value, "Cancelaciones"]}
          labelFormatter={(label) => label}
        />
        <Area
          type="monotone"
          dataKey="count"
          name="Cancelaciones"
          stroke={CANCELLATION_FILL}
          fill="url(#cancellationsByDayGradient)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

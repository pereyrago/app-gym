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
import type { CancellationsByMonthRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

const CANCELLATION_STROKE = "hsl(25, 95%, 53%)";

function formatPeriod(period: string): string {
  if (!period || period.length < 7) return period;
  const [y, m] = period.split("-");
  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const i = parseInt(m, 10) - 1;
  return i >= 0 && i < 12 ? `${months[i]} ${y}` : period;
}

type CancellationsByMonthChartProps = {
  data: CancellationsByMonthRow[];
  emptyMessage?: string;
};

/** LineChart por mes: tendencia clara de cancelaciones en el tiempo (reemplaza tendencia por día). */
export function CancellationsByMonthChart({
  data,
  emptyMessage = "Sin datos",
}: CancellationsByMonthChartProps) {
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
    periodLabel: formatPeriod(d.period),
    monthDate: d.month_date,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
        <XAxis dataKey="periodLabel" tick={{ fontSize: 11 }} tickLine={false} />
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
            payload?.[0]?.payload?.monthDate
              ? format(parseISO(payload[0].payload.monthDate), "MMMM yyyy", { locale: es })
              : ""
          }
          formatter={(value: number) => [value, "Cancelaciones"]}
        />
        <Line
          type="monotone"
          dataKey="count"
          name="Cancelaciones"
          stroke={CANCELLATION_STROKE}
          strokeWidth={2}
          dot={{ r: 3, fill: CANCELLATION_STROKE }}
          activeDot={{ r: 4, fill: CANCELLATION_STROKE }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

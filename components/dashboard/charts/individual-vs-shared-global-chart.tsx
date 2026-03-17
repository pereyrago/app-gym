"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { IndividualVsSharedTotalsRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

const INDIVIDUAL_FILL = "hsl(145, 100%, 47%)";
const SHARED_FILL = "hsl(262, 81%, 65%)";

type IndividualVsSharedGlobalChartProps = {
  data: IndividualVsSharedTotalsRow | null;
  emptyMessage?: string;
};

/** BarChart de dos barras: distribución global Individual vs Grupal (no PieChart). */
export function IndividualVsSharedGlobalChart({
  data,
  emptyMessage = "Sin datos",
}: IndividualVsSharedGlobalChartProps) {
  const colors = useChartColors();
  const chartData =
    data != null
      ? [
          { tipo: "Individual", cantidad: data.individual_total },
          { tipo: "Grupal", cantidad: data.shared_total },
        ]
      : [];

  if (!chartData.length || (chartData[0].cantidad === 0 && chartData[1].cantidad === 0)) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const fills = [INDIVIDUAL_FILL, SHARED_FILL];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
        <XAxis dataKey="tipo" tick={{ fontSize: 11 }} tickLine={false} />
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
          formatter={(value, _name, item) => [
            value as number,
            (item &&
              "payload" in item &&
              (item as { payload?: { tipo?: string } }).payload?.tipo) ||
              "Clases",
          ]}
          labelFormatter={() => "Clases"}
        />
        <Bar dataKey="cantidad" name="Clases" radius={[4, 4, 0, 0]}>
          {chartData.map((_entry, index) => (
            <Cell key={_entry.tipo} fill={fills[index % fills.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { CancellationReasonRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

const REASONS_FILL = "hsl(25, 95%, 53%)";

type CancellationReasonsChartProps = {
  data: CancellationReasonRow[];
  emptyMessage?: string;
};

/** BarChart vertical: motivos de cancelación (mejor legibilidad que Pie cuando hay varias categorías). */
export function CancellationReasonsChart({
  data,
  emptyMessage = "Sin datos",
}: CancellationReasonsChartProps) {
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
        <XAxis dataKey="reason_label" tick={{ fontSize: 11 }} tickLine={false} />
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
          formatter={(value: number) => [value, "Cantidad"]}
          labelFormatter={(label) => label}
        />
        <Bar dataKey="count" name="Cantidad" fill={REASONS_FILL} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

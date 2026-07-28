"use client";

import { useMemo, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BusinessEvolutionRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

type MetricKey =
  | "classes_count"
  | "hours"
  | "active_students_count"
  | "new_students_count"
  | "cancellations_count";

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "classes_count", label: "Clases" },
  { key: "hours", label: "Horas" },
  { key: "active_students_count", label: "Alumnos activos" },
  { key: "new_students_count", label: "Nuevos alumnos" },
  { key: "cancellations_count", label: "Cancelaciones" },
];

type BusinessEvolutionChartProps = {
  data: BusinessEvolutionRow[];
  emptyMessage?: string;
};

export function BusinessEvolutionChart({
  data,
  emptyMessage = "Sin datos",
}: BusinessEvolutionChartProps) {
  const colors = useChartColors();
  const [metric, setMetric] = useState<MetricKey>("classes_count");
  const activeMetric = METRICS.find((m) => m.key === metric) ?? METRICS[0];

  const chartData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        dateLabel: format(parseISO(d.day), "d MMM", { locale: es }),
      })),
    [data]
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
          <SelectTrigger className="h-8 w-[180px] text-[13px]" aria-label="Métrica">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METRICS.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!data.length ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="dateLabel" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis
              allowDecimals={activeMetric.key === "hours"}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={32}
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
              formatter={(value: number) => [value, activeMetric.label]}
            />
            <Line
              type="monotone"
              dataKey={activeMetric.key}
              name={activeMetric.label}
              stroke={colors.chart1}
              strokeWidth={2}
              dot={{ r: 3, fill: colors.chart1 }}
              activeDot={{ r: 4, fill: colors.chart1 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

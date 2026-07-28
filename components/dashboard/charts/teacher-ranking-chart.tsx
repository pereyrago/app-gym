"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeacherRankingRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

type MetricKey = "classes_count" | "hours" | "unique_students" | "cancellations_count" | "attendance_pct";

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "classes_count", label: "Clases dadas" },
  { key: "hours", label: "Horas trabajadas" },
  { key: "unique_students", label: "Cantidad de alumnos" },
  { key: "cancellations_count", label: "Cancelaciones" },
  { key: "attendance_pct", label: "Asistencia" },
];

type TeacherRankingChartProps = {
  data: TeacherRankingRow[];
  emptyMessage?: string;
};

export function TeacherRankingChart({ data, emptyMessage = "Sin datos" }: TeacherRankingChartProps) {
  const colors = useChartColors();
  const [metric, setMetric] = useState<MetricKey>("classes_count");
  const activeMetric = METRICS.find((m) => m.key === metric) ?? METRICS[0];

  const sorted = useMemo(
    () => [...data].sort((a, b) => b[activeMetric.key] - a[activeMetric.key]),
    [data, activeMetric.key]
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
          <SelectTrigger className="h-8 w-[190px] text-[13px]" aria-label="Métrica de ranking">
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

      {!sorted.length ? (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={sorted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
            <YAxis
              type="category"
              dataKey="teacher_name"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                backgroundColor: "hsl(var(--card))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
              }}
              cursor={{ fill: colors.chartHover }}
              formatter={(value: number) => [
                activeMetric.key === "attendance_pct" ? `${value}%` : value,
                activeMetric.label,
              ]}
            />
            <Bar dataKey={activeMetric.key} name={activeMetric.label} fill={colors.secondary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

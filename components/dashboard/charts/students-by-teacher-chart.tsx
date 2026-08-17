"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from "recharts";
import type { StudentsByTeacherRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

type StudentsByTeacherChartProps = {
  data: StudentsByTeacherRow[];
  emptyMessage?: string;
};

export function StudentsByTeacherChart({
  data,
  emptyMessage = "Sin datos",
}: StudentsByTeacherChartProps) {
  const colors = useChartColors();

  if (!data.length) {
    return (
      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.student_count - a.student_count).slice(0, 5);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={sorted} margin={{ top: 2, right: 28, left: 0, bottom: 2 }} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="teacher_name"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={88}
          tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 11)}…` : v)}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            backgroundColor: "hsl(var(--card))",
            color: "hsl(var(--foreground))",
            border: "1px solid hsl(var(--border))",
          }}
          cursor={{ fill: colors.chartHover }}
          formatter={(value: number) => [value, "Alumnos"]}
        />
        <Bar dataKey="student_count" name="Alumnos" fill={colors.tertiary} radius={[0, 4, 4, 0]}>
          <LabelList
            dataKey="student_count"
            position="right"
            style={{ fontSize: 11, fontWeight: 600, fill: "hsl(var(--foreground))" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

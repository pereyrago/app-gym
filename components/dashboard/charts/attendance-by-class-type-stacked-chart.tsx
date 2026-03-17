"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { AttendanceByClassTypeOverTimeRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

type AttendanceByClassTypeStackedChartProps = {
  data: AttendanceByClassTypeOverTimeRow[];
  emptyMessage?: string;
};

function buildStackedData(rows: AttendanceByClassTypeOverTimeRow[]) {
  const byDay = new Map<string, Record<string, number>>();
  const types = new Set<string>();
  for (const r of rows) {
    types.add(r.class_type_name);
    const existing = byDay.get(r.day) ?? {};
    existing[r.class_type_name] = (existing[r.class_type_name] ?? 0) + r.count;
    byDay.set(r.day, existing);
  }
  const sortedDays = Array.from(byDay.keys()).sort();
  return sortedDays.map((day) => {
    const row: Record<string, string | number> = {
      day,
      dateLabel: format(parseISO(day), "d MMM", { locale: es }),
    };
    for (const t of types) {
      row[t] = byDay.get(day)?.[t] ?? 0;
    }
    return row;
  });
}

export function AttendanceByClassTypeStackedChart({
  data,
  emptyMessage = "Sin datos",
}: AttendanceByClassTypeStackedChartProps) {
  const colors = useChartColors();
  const palette = [colors.chart1, colors.chart2, colors.chart3, colors.chart4, colors.chart5];
  const stacked = buildStackedData(data);
  const typeNames = Array.from(new Set(data.map((r) => r.class_type_name))).sort();

  if (!stacked.length || !typeNames.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={stacked}
        margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        barCategoryGap={14}
        barGap={2}
      >
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
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {typeNames.map((name, i) => (
          <Bar
            key={name}
            dataKey={name}
            fill={palette[i % palette.length]}
            radius={[3, 3, 0, 0]}
            barSize={6}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CancellationsByTeacherOverTimeRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

const TEACHER_COLORS = [
  "hsl(25, 95%, 53%)",
  "hsl(262, 81%, 65%)",
  "hsl(145, 100%, 47%)",
  "hsl(175, 60%, 42%)",
  "hsl(35, 90%, 55%)",
];

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

type CancellationsByTeacherOverTimeChartProps = {
  data: CancellationsByTeacherOverTimeRow[];
  emptyMessage?: string;
};

const MAX_TEACHERS_MULTI_LINE = 5;

/**
 * Multi-line por profesor si hay ≤5 profesores; si hay >5, selector de profesor y una sola línea.
 */
export function CancellationsByTeacherOverTimeChart({
  data,
  emptyMessage = "Sin datos",
}: CancellationsByTeacherOverTimeChartProps) {
  const colors = useChartColors();
  const teachers = useMemo(() => {
    const set = new Map<string, string>();
    data.forEach((r) => set.set(r.teacher_id, r.teacher_name));
    return Array.from(set.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id ?? "");

  useEffect(() => {
    if (!teachers.length) return;
    setSelectedTeacherId((prev) => (teachers.some((t) => t.id === prev) ? prev : teachers[0]!.id));
  }, [teachers]);

  const useMultiLine = teachers.length <= MAX_TEACHERS_MULTI_LINE;
  const periods = useMemo(() => {
    const set = new Set<string>();
    data.forEach((r) => set.add(r.period));
    return Array.from(set).sort();
  }, [data]);

  const chartData = useMemo(() => {
    if (useMultiLine) {
      return periods.map((period) => {
        const row: Record<string, string | number> = { period, periodLabel: formatPeriod(period) };
        teachers.forEach((t) => {
          const r = data.find((d) => d.period === period && d.teacher_id === t.id);
          row[t.id] = r?.count ?? 0;
        });
        return row;
      });
    }
    const filtered = data.filter((d) => d.teacher_id === selectedTeacherId);
    return periods.map((period) => {
      const r = filtered.find((d) => d.period === period);
      return {
        period,
        periodLabel: formatPeriod(period),
        count: r?.count ?? 0,
      };
    });
  }, [useMultiLine, periods, teachers, data, selectedTeacherId]);

  if (!data.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  if (useMultiLine) {
    return (
      <div className="space-y-2">
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
              formatter={(value: number, name: string) => {
                const t = teachers.find((x) => x.id === name);
                return [value, t?.name ?? name];
              }}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.periodLabel ?? ""}
            />
            <Legend
              formatter={(value: string) => teachers.find((t) => t.id === value)?.name ?? value}
            />
            {teachers.map((t, i) => (
              <Line
                key={t.id}
                type="monotone"
                dataKey={t.id}
                name={t.name}
                stroke={TEACHER_COLORS[i % TEACHER_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 2 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const selectedName = teachers.find((t) => t.id === selectedTeacherId)?.name ?? "Profesor";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Profesor:</span>
        <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
          <SelectTrigger className="h-8 w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
            formatter={(value: number) => [value, "Cancelaciones"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.periodLabel ?? ""}
          />
          <Line
            type="monotone"
            dataKey="count"
            name={selectedName}
            stroke={TEACHER_COLORS[0]}
            strokeWidth={2}
            dot={{ r: 3, fill: TEACHER_COLORS[0] }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

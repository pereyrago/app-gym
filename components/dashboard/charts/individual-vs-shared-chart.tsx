"use client";

import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type {
  IndividualVsSharedOverTimeRow,
  IndividualVsSharedByTeacherRow,
} from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

const INDIVIDUAL_FILL = "hsl(145, 100%, 47%)";
const SHARED_FILL = "hsl(262, 81%, 65%)";

type IndividualVsSharedOverTimeChartProps = {
  data: IndividualVsSharedOverTimeRow[];
  emptyMessage?: string;
};

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

/** Stacked AreaChart: tendencia + proporción individual vs grupal en el tiempo (reemplaza barras agrupadas). */
export function IndividualVsSharedOverTimeStackedAreaChart({
  data,
  emptyMessage = "Sin datos",
}: IndividualVsSharedOverTimeChartProps) {
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
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="individualGradientIvsS" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={INDIVIDUAL_FILL} stopOpacity={0.8} />
            <stop offset="95%" stopColor={INDIVIDUAL_FILL} stopOpacity={0.2} />
          </linearGradient>
          <linearGradient id="sharedGradientIvsS" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={SHARED_FILL} stopOpacity={0.8} />
            <stop offset="95%" stopColor={SHARED_FILL} stopOpacity={0.2} />
          </linearGradient>
        </defs>
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
          formatter={(value: number, name: string) => [
            value,
            name === "individual_count" ? "Individuales" : "Grupales",
          ]}
          labelFormatter={(label) => label}
        />
        <Legend
          formatter={(value) => (value === "individual_count" ? "Individuales" : "Grupales")}
        />
        <Area
          type="monotone"
          dataKey="individual_count"
          name="individual_count"
          stackId="1"
          stroke={INDIVIDUAL_FILL}
          fill="url(#individualGradientIvsS)"
          strokeWidth={1}
        />
        <Area
          type="monotone"
          dataKey="shared_count"
          name="shared_count"
          stackId="1"
          stroke={SHARED_FILL}
          fill="url(#sharedGradientIvsS)"
          strokeWidth={1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** @deprecated Usar IndividualVsSharedOverTimeStackedAreaChart para tendencia + proporción. */
export function IndividualVsSharedOverTimeChart({
  data,
  emptyMessage = "Sin datos",
}: IndividualVsSharedOverTimeChartProps) {
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
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
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
          formatter={(value: number, name: string) => [
            value,
            name === "individual_count" ? "Individuales" : "Grupales",
          ]}
          labelFormatter={(label) => label}
        />
        <Legend
          formatter={(value) => (value === "individual_count" ? "Individuales" : "Grupales")}
        />
        <Bar
          dataKey="individual_count"
          name="individual_count"
          fill={INDIVIDUAL_FILL}
          radius={[4, 4, 0, 0]}
        />
        <Bar dataKey="shared_count" name="shared_count" fill={SHARED_FILL} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

type IndividualVsSharedByTeacherChartProps = {
  data: IndividualVsSharedByTeacherRow[];
  emptyMessage?: string;
};

export function IndividualVsSharedByTeacherChart({
  data,
  emptyMessage = "Sin datos",
}: IndividualVsSharedByTeacherChartProps) {
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
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
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
          formatter={(value: number, name: string) => [
            value,
            name === "individual_count" ? "Individuales" : "Grupales",
          ]}
        />
        <Legend
          formatter={(value) => (value === "individual_count" ? "Individuales" : "Grupales")}
        />
        <Bar
          dataKey="individual_count"
          name="individual_count"
          fill={INDIVIDUAL_FILL}
          radius={[0, 4, 4, 0]}
        />
        <Bar dataKey="shared_count" name="shared_count" fill={SHARED_FILL} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

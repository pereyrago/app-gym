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
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, startOfYear } from "date-fns";
import { es } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { BusinessEvolutionRow } from "@/features/dashboard/types";
import { useChartColors } from "@/hooks/use-chart-colors";

// ─── Tipos ────────────────────────────────────────────────────────────────────
type MetricKey =
  | "classes_count"
  | "hours"
  | "active_students_count"
  | "new_students_count"
  | "cancellations_count";

type Granularity = "day" | "week" | "month" | "year";

// ─── Constantes ───────────────────────────────────────────────────────────────
const METRICS: { key: MetricKey; label: string }[] = [
  { key: "classes_count", label: "Clases realizadas" },
  { key: "hours", label: "Horas" },
  { key: "active_students_count", label: "Alumnos activos" },
  { key: "new_students_count", label: "Nuevos alumnos" },
  { key: "cancellations_count", label: "Cancelaciones" },
];

const GRANULARITIES: { key: Granularity; label: string }[] = [
  { key: "day", label: "Día" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
  { key: "year", label: "Año" },
];

// ─── Agregación client-side — sin RPC nueva ───────────────────────────────────
/**
 * Agrupa filas diarias en el período solicitado sumando todas las métricas.
 * Para "active_students_count" usa el promedio del grupo (es un nivel, no un acumulado).
 * Devuelve filas con la misma forma que BusinessEvolutionRow más un `label` para el eje X.
 */
function aggregate(
  data: BusinessEvolutionRow[],
  granularity: Granularity
): Array<BusinessEvolutionRow & { label: string; periodKey: string }> {
  if (!data.length) return [];
  if (granularity === "day") {
    return data.map((d) => ({
      ...d,
      label: format(parseISO(d.day), "d MMM", { locale: es }),
      periodKey: d.day,
    }));
  }

  // Agrupar por clave de período
  const groups = new Map<string, { rows: BusinessEvolutionRow[]; periodStart: Date }>();

  for (const row of data) {
    const date = parseISO(row.day);
    let periodStart: Date;
    let key: string;

    switch (granularity) {
      case "week":
        periodStart = startOfWeek(date, { weekStartsOn: 1 }); // lunes
        key = format(periodStart, "yyyy-'W'II");
        break;
      case "month":
        periodStart = startOfMonth(date);
        key = format(periodStart, "yyyy-MM");
        break;
      case "year":
        periodStart = startOfYear(date);
        key = format(periodStart, "yyyy");
        break;
    }

    if (!groups.has(key)) groups.set(key, { rows: [], periodStart });
    groups.get(key)!.rows.push(row);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { rows, periodStart }]) => {
      const sum = (field: Exclude<MetricKey, "active_students_count">) =>
        rows.reduce((acc, r) => acc + r[field], 0);
      const avg = (field: "active_students_count") =>
        Math.round(rows.reduce((acc, r) => acc + r[field], 0) / rows.length);

      let label: string;
      switch (granularity) {
        case "week": {
          const periodEnd = endOfWeek(periodStart, { weekStartsOn: 1 });
          const sameMonth = periodStart.getMonth() === periodEnd.getMonth();
          if (sameMonth) {
            label = `${format(periodStart, "d")} - ${format(periodEnd, "d MMM", { locale: es })}`;
          } else {
            label = `${format(periodStart, "d MMM", { locale: es })} - ${format(periodEnd, "d MMM", { locale: es })}`;
          }
          break;
        }
        case "month":
          label = format(periodStart, "MMM yyyy", { locale: es });
          label = label.charAt(0).toUpperCase() + label.slice(1);
          break;
        case "year":
          label = format(periodStart, "yyyy");
          break;
        default:
          label = key;
      }

      return {
        day: format(periodStart, "yyyy-MM-dd"),
        label,
        periodKey: key,
        classes_count: sum("classes_count"),
        hours: rows.reduce((acc, r) => acc + r.hours, 0),
        active_students_count: avg("active_students_count"),
        new_students_count: sum("new_students_count"),
        cancellations_count: sum("cancellations_count"),
      };
    });
}

// ─── Componente ───────────────────────────────────────────────────────────────
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
  const [granularity, setGranularity] = useState<Granularity>("month");

  const activeMetric = METRICS.find((m) => m.key === metric) ?? METRICS[0]!;

  const chartData = useMemo(() => aggregate(data, granularity), [data, granularity]);

  // Tooltip: mostrar período completo según granularidad
  const tooltipLabel = (payload: Array<{ payload?: { day?: string; label?: string } }>) => {
    const row = payload?.[0]?.payload;
    if (!row) return "";
    if (granularity === "day" && row.day) {
      return format(parseISO(row.day), "EEEE d 'de' MMMM yyyy", { locale: es });
    }
    if (granularity === "week" && row.day) {
      const start = parseISO(row.day);
      const end = endOfWeek(start, { weekStartsOn: 1 });
      return `Semana del ${format(start, "d 'de' MMMM", { locale: es })} al ${format(end, "d 'de' MMMM yyyy", { locale: es })}`;
    }
    return row.label ?? "";
  };

  return (
    <div className="space-y-3">
      {/* Controles: toggles de granularidad + selector de métrica */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Toggles Día / Semana / Mes / Año */}
        <div
          className="flex rounded-md border border-border/60 p-0.5"
          role="group"
          aria-label="Granularidad"
        >
          {GRANULARITIES.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGranularity(g.key)}
              className={cn(
                "rounded px-2.5 py-1 text-[12px] font-medium transition-colors",
                granularity === g.key
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-pressed={granularity === g.key}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Selector de métrica */}
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] text-muted-foreground">Mostrar:</span>
          <Select value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
            <SelectTrigger className="h-8 w-[170px] text-[13px]" aria-label="Métrica">
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
      </div>

      {!data.length ? (
        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
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
                tooltipLabel(payload as Array<{ payload?: { day?: string; label?: string } }>)
              }
              formatter={(value: number) => [
                activeMetric.key === "hours" ? value.toFixed(1) : value,
                activeMetric.label,
              ]}
            />
            <Line
              type="monotoneX"
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

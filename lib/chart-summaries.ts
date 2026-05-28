import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { DayCount, WeekdayCount, TimeSlotCount } from "@/features/dashboard/types";

export function summarizeDayCounts(data: DayCount[], metricLabel = "registros"): string {
  if (!data.length) return `Sin ${metricLabel} en el período.`;
  const total = data.reduce((s, d) => s + d.count, 0);
  const peak = data.reduce((a, b) => (b.count > a.count ? b : a));
  const peakDay = format(parseISO(peak.day), "EEEE d MMM", { locale: es });
  return `Total ${total} ${metricLabel}. Pico: ${peak.count} el ${peakDay}.`;
}

export function summarizeWeekdayCounts(data: WeekdayCount[], metricLabel = "registros"): string {
  if (!data.length) return `Sin ${metricLabel} por día de la semana.`;
  const peak = data.reduce((a, b) => (b.count > a.count ? b : a));
  return `Mayor volumen los ${peak.weekday_name}: ${peak.count} ${metricLabel}.`;
}

export function summarizeTimeSlotCounts(data: TimeSlotCount[], metricLabel = "registros"): string {
  if (!data.length) return `Sin ${metricLabel} por franja horaria.`;
  const peak = data.reduce((a, b) => (b.count > a.count ? b : a));
  return `Franja con más ${metricLabel}: ${peak.time_slot} (${peak.count}).`;
}

export function summarizeLabeledCounts(
  data: { label: string; count: number }[],
  metricLabel = "registros"
): string {
  if (!data.length) return `Sin ${metricLabel}.`;
  const total = data.reduce((s, d) => s + d.count, 0);
  const peak = data.reduce((a, b) => (b.count > a.count ? b : a));
  return `Total ${total} ${metricLabel}. Máximo en ${peak.label}: ${peak.count}.`;
}

export function dayCountTable(data: DayCount[]): { headers: string[]; rows: string[][] } {
  return {
    headers: ["Fecha", "Cantidad"],
    rows: data.map((d) => [
      format(parseISO(d.day), "d MMM yyyy", { locale: es }),
      String(d.count),
    ]),
  };
}

export function weekdayCountTable(data: WeekdayCount[]): { headers: string[]; rows: string[][] } {
  return {
    headers: ["Día", "Cantidad"],
    rows: data.map((d) => [d.weekday_name, String(d.count)]),
  };
}

export function timeSlotCountTable(data: TimeSlotCount[]): { headers: string[]; rows: string[][] } {
  return {
    headers: ["Franja", "Cantidad"],
    rows: data.map((d) => [d.time_slot, String(d.count)]),
  };
}

export function genericCountSummary(
  data: { count: number }[],
  emptyLabel: string,
  metricLabel: string
): string {
  if (!data.length) return emptyLabel;
  const total = data.reduce((s, d) => s + d.count, 0);
  return `Total ${total} ${metricLabel} en el período seleccionado.`;
}

"use client";

import type { TeacherCancellationRow, TeacherRankingRow } from "@/features/dashboard/types";

// Barra: verde si < 5%, amarillo si 5-10%, rojo si > 10%
function barColor(pct: number): string {
  if (pct >= 10) return "bg-red-500";
  if (pct >= 5) return "bg-yellow-500";
  return "bg-green-500";
}

type TeachersCancellationsChartProps = {
  data: TeacherCancellationRow[];
  /**
   * Opcional: si se pasa, se usa para calcular el % de cancelaciones
   * (cancellations_count / classes_count). Sin esta prop se muestra solo
   * el número absoluto — el callsite existente sigue funcionando sin cambios.
   */
  teacherRanking?: TeacherRankingRow[];
  emptyMessage?: string;
};

export function TeachersCancellationsChart({
  data,
  teacherRanking,
  emptyMessage = "Sin datos",
}: TeachersCancellationsChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[160px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // Índice de clases por profesor si tenemos el ranking — sin fetch
  const classesById = new Map((teacherRanking ?? []).map((r) => [r.teacher_id, r.classes_count]));

  const sorted = [...data].sort((a, b) => b.cancellation_count - a.cancellation_count).slice(0, 5);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-1">
        <span className="text-[11px] text-muted-foreground">Profesor</span>
        <span className="text-[11px] text-muted-foreground">Canc.</span>
        {teacherRanking && <span className="text-[11px] text-muted-foreground">%</span>}
      </div>

      {/* Filas */}
      {sorted.map((row) => {
        const classes = classesById.get(row.teacher_id);
        const pct =
          classes != null && classes > 0 ? (row.cancellation_count / classes) * 100 : null;

        return (
          <div
            key={row.teacher_id}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-1"
          >
            {/* Nombre + barra */}
            <div className="min-w-0 space-y-0.5">
              <p className="truncate text-[13px] font-medium capitalize leading-none">
                {row.teacher_name}
              </p>
              {pct !== null && (
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                  <div
                    className={`h-full rounded-full transition-all ${barColor(pct)}`}
                    style={{ width: `${Math.min(pct, 100).toFixed(1)}%` }}
                    aria-hidden
                  />
                </div>
              )}
            </div>

            {/* Conteo absoluto */}
            <span className="text-[13px] tabular-nums text-muted-foreground">
              {row.cancellation_count}
            </span>

            {/* Porcentaje — solo si tenemos datos de clases */}
            {teacherRanking && (
              <span className="w-10 text-right text-[13px] font-semibold tabular-nums">
                {pct !== null ? `${pct.toFixed(0)}%` : "—"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

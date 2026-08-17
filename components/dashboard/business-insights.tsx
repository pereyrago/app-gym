"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import type {
  DashboardKpis,
  ExecutiveSummaryKpis,
  TeacherRankingRow,
} from "@/features/dashboard/types";

// ─── Props ────────────────────────────────────────────────────────────────────
type BusinessInsightsProps = {
  kpis: DashboardKpis | null;
  topTimeSlot: string | null;
  topWeekday: string | null;
  topClassType: string | null;
  topTeacherByAvg: string | null;
  /**
   * Opcional: datos del resumen ejecutivo (current/previous/variationPct).
   * Provienen de get_executive_summary_kpis, ya fetcheado en DashboardPreviewSection.
   * Si no se pasa, los insights que dependen de variación vs. período anterior se omiten.
   */
  executiveSummaryKpis?: ExecutiveSummaryKpis | null;
  /**
   * Opcional: ranking de profesores de get_teacher_ranking_metrics.
   * Permite generar insights del profesor con más clases y mayor tasa de cancelaciones.
   */
  teacherRanking?: TeacherRankingRow[] | null;
};

// ─── Tipos internos ───────────────────────────────────────────────────────────
type InsightVariant = "positive" | "negative" | "warning" | "neutral";

type Insight = {
  text: string;
  variant: InsightVariant;
};

function variantIcon(v: InsightVariant) {
  switch (v) {
    case "positive":
      return CheckCircle2;
    case "negative":
      return XCircle;
    case "warning":
      return AlertTriangle;
    case "neutral":
      return TrendingUp;
  }
}

function variantColor(v: InsightVariant): string {
  switch (v) {
    case "positive":
      return "text-emerald-400";
    case "negative":
      return "text-red-400";
    case "warning":
      return "text-amber-400";
    case "neutral":
      return "text-blue-400";
  }
}

// ─── Generación de frases ─────────────────────────────────────────────────────
function buildInsights(
  kpis: DashboardKpis,
  exec: ExecutiveSummaryKpis | null | undefined,
  teacherRanking: TeacherRankingRow[] | null | undefined
): Insight[] {
  const insights: Insight[] = [];

  // 1. Nuevos alumnos este período (requiere exec)
  if (exec && exec.newStudents.current > 0) {
    insights.push({
      text: `Se incorporaron ${exec.newStudents.current} alumno${exec.newStudents.current !== 1 ? "s" : ""} en el período.`,
      variant: "positive",
    });
  }

  // 2. Variación de clases vs. período anterior (requiere exec)
  if (exec && exec.classes.variationPct !== 0) {
    const pct = exec.classes.variationPct;
    const sign = pct > 0 ? "+" : "";
    insights.push({
      text: `Las clases ${pct > 0 ? "aumentaron" : "disminuyeron"} un ${sign}${pct}% respecto al período anterior.`,
      variant: pct > 0 ? "positive" : "warning",
    });
  }

  // 3. Profesor con más clases (requiere teacherRanking)
  if (teacherRanking && teacherRanking.length > 0) {
    const top = [...teacherRanking].sort((a, b) => b.classes_count - a.classes_count)[0]!;
    if (top.classes_count > 0) {
      const name = top.teacher_name
        ? top.teacher_name.charAt(0).toUpperCase() + top.teacher_name.slice(1).toLowerCase()
        : "Un profesor";
      insights.push({
        text: `${name} fue el profesor con más clases dadas (${top.classes_count}).`,
        variant: "neutral",
      });
    }
  }

  // 4. Profesor con mayor tasa de cancelaciones (requiere teacherRanking)
  if (teacherRanking && teacherRanking.length > 0) {
    const withClasses = teacherRanking.filter((r) => r.classes_count > 0);
    if (withClasses.length > 0) {
      const worst = withClasses.reduce((a, b) => {
        const pctA = a.cancellations_count / a.classes_count;
        const pctB = b.cancellations_count / b.classes_count;
        return pctA >= pctB ? a : b;
      });
      const cancPct = Math.round((worst.cancellations_count / worst.classes_count) * 100);
      if (cancPct > 0) {
        const name = worst.teacher_name
          ? worst.teacher_name.charAt(0).toUpperCase() + worst.teacher_name.slice(1).toLowerCase()
          : "Un profesor";
        insights.push({
          text: `${name} tuvo la mayor tasa de cancelaciones (${cancPct}%).`,
          variant: cancPct >= 15 ? "negative" : "warning",
        });
      }
    }
  }

  // 5. Alumnos en riesgo (siempre disponible en DashboardKpis)
  if (kpis.at_risk_students > 0) {
    insights.push({
      text: `Hay ${kpis.at_risk_students} alumno${kpis.at_risk_students !== 1 ? "s" : ""} que no entrenan hace más de 14 días.`,
      variant: kpis.at_risk_students >= 5 ? "negative" : "warning",
    });
  }

  // 6. Profesor con mejor promedio por clase (disponible en props actuales)
  // Nota: topTeacherByAvg viene de teachersPerformance, no de teacherRanking — se omite
  // aquí porque con teacherRanking ya cubrimos 3 y 4.

  // 7. Tasa de asistencia (requiere exec)
  if (exec && exec.attendanceRatePct.current > 0) {
    const rate = exec.attendanceRatePct.current.toFixed(1);
    const isGood = exec.attendanceRatePct.current >= 80;
    insights.push({
      text: `La tasa de asistencia del período fue del ${rate}%.`,
      variant: isGood ? "positive" : "warning",
    });
  }

  return insights;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function BusinessInsights({
  kpis,
  executiveSummaryKpis,
  teacherRanking,
}: BusinessInsightsProps) {
  if (!kpis) return null;

  const insights = buildInsights(kpis, executiveSummaryKpis, teacherRanking);

  if (insights.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        No hay suficientes datos para generar insights en el período seleccionado.
      </p>
    );
  }

  return (
    <ul className="space-y-2.5" aria-label="Insights del período">
      {insights.map((insight, i) => {
        const Icon = variantIcon(insight.variant);
        return (
          <li key={i} className="flex items-start gap-2.5">
            <Icon
              className={cn("mt-0.5 h-4 w-4 shrink-0", variantColor(insight.variant))}
              aria-hidden
            />
            <span className="text-[13px] leading-snug">{insight.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardKpis } from "@/features/dashboard/types";

type BusinessInsightsProps = {
  kpis: DashboardKpis | null;
  topTimeSlot: string | null;
  topWeekday: string | null;
  topClassType: string | null;
  topTeacherByAvg: string | null;
};

export function BusinessInsights({
  kpis,
  topTimeSlot,
  topWeekday,
  topClassType,
  topTeacherByAvg,
}: BusinessInsightsProps) {
  if (!kpis) return null;

  const activityRate =
    kpis.total_students > 0 ? ((kpis.active_students / kpis.total_students) * 100).toFixed(1) : "0";

  const insights: { title: string; value: string; subtitle?: string }[] = [
    {
      title: "Tasa de actividad",
      value: `${activityRate}%`,
      subtitle: "Alumnos activos sobre total",
    },
    {
      title: "Promedio asistencias por clase",
      value: kpis.avg_attendances_per_class.toFixed(1),
      subtitle: "En el período seleccionado",
    },
    ...(topTimeSlot ? [{ title: "Franja horaria pico", value: topTimeSlot }] : []),
    ...(topWeekday ? [{ title: "Día con más asistencia", value: topWeekday }] : []),
    ...(topClassType ? [{ title: "Tipo de clase con más demanda", value: topClassType }] : []),
    ...(topTeacherByAvg
      ? [{ title: "Profesor con mejor promedio por clase", value: topTeacherByAvg }]
      : []),
    {
      title: "Alumnos en riesgo de abandono",
      value: String(kpis.at_risk_students),
      subtitle: "Sin asistir en 30+ días",
    },
    {
      title: "Tipos de clase disponibles",
      value: String(kpis.class_types_count),
    },
  ];

  return (
    <Card className="border border-border/80 shadow-none">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold">Insights de negocio</CardTitle>
        <p className="text-[13px] text-muted-foreground">
          Métricas clave para decisiones operativas.
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((insight) => (
            <div key={insight.title} className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <p className="text-[12px] font-medium text-muted-foreground">{insight.title}</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">{insight.value}</p>
              {insight.subtitle && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">{insight.subtitle}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

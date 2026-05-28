type DashboardHeaderProps = {
  title?: string;
  description?: string;
};

export function DashboardHeader({
  title = "Dashboard",
  description = "Métricas de alumnos, clases, profesores y asistencia.",
}: DashboardHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-pretty text-lg font-semibold tracking-tight">{title}</h1>
      <p className="text-[13px] text-muted-foreground">{description}</p>
    </div>
  );
}

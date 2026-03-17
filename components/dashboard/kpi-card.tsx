import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  icon?: LucideIcon;
  className?: string;
  /** Opcional: nodo para sparkline o mini chart */
  children?: React.ReactNode;
};

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  className,
  children,
}: KpiCardProps) {
  return (
    <Card className={cn("border border-border/80 shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
        <span className="text-[13px] font-medium text-muted-foreground">{title}</span>
        {Icon && <Icon className="h-4 w-4 shrink-0 text-secondary" aria-hidden />}
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        {(subtitle ?? trendLabel) && (
          <div className="mt-1 flex items-center gap-2 text-[12px] text-muted-foreground">
            {trend === "up" && (
              <span className="text-green-600" aria-hidden>
                ↑
              </span>
            )}
            {trend === "down" && (
              <span className="text-red-600" aria-hidden>
                ↓
              </span>
            )}
            {trendLabel && <span>{trendLabel}</span>}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

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
  iconCircle?: string;
  className?: string;
  children?: React.ReactNode;
};

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  iconCircle,
  className,
  children,
}: KpiCardProps) {
  return (
    <Card className={cn("border border-border/80 shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
        <span className="text-[13px] font-medium text-muted-foreground">{title}</span>
        {Icon && !iconCircle && <Icon className="h-4 w-4 shrink-0 text-secondary" aria-hidden />}
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="flex gap-3">
          {Icon && iconCircle && (
            <div
              className={cn(
                "mb-2 flex h-10 w-10 items-center justify-center rounded-full",
                iconCircle
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </div>
          )}
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
        </div>
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

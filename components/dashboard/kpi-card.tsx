import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

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
    <Card className={cn("border border-border/80 shadow-none transition-colors", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-1.5">
        <span className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground truncate">
          {title}
        </span>
        {Icon && (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full shrink-0 shadow-sm",
              iconCircle || "text-muted-foreground/70 bg-muted/50"
            )}
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </CardHeader>
      <CardContent className="p-3.5 pt-0">
        <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground">{value}</p>
        {(subtitle ?? trendLabel) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            {trend === "up" && (
              <span className="inline-flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" aria-hidden />
                {trendLabel}
              </span>
            )}
            {trend === "down" && (
              <span className="inline-flex items-center gap-0.5 font-medium text-rose-600 dark:text-rose-400">
                <TrendingDown className="h-3 w-3" aria-hidden />
                {trendLabel}
              </span>
            )}
            {trend === "neutral" && trendLabel && <span>{trendLabel}</span>}
            {subtitle && (
              <span className={cn(trendLabel && "before:content-['·'] before:mr-1")}>
                {subtitle}
              </span>
            )}
          </div>
        )}

        {children}
      </CardContent>
    </Card>
  );
}

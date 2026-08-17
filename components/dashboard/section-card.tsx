import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/dashboard/chart-container";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Accessible summary for chart content (enables screen-reader description + optional data table). */
  chartSummary?: string;
  chartTableHeaders?: string[];
  chartTableRows?: string[][];
};

export function SectionCard({
  title,
  description,
  children,
  className,
  chartSummary,
  chartTableHeaders,
  chartTableRows,
}: SectionCardProps) {
  const body =
    chartSummary != null ? (
      <ChartContainer
        title={title}
        summary={chartSummary}
        tableHeaders={chartTableHeaders}
        tableRows={chartTableRows}
      >
        {children}
      </ChartContainer>
    ) : (
      children
    );

  return (
    <Card className={cn("border border-border/80 shadow-none h-full flex flex-col", className)}>
      <CardHeader className="space-y-1 p-4 pb-2.5">
        <CardTitle className="text-base font-semibold leading-snug text-pretty">{title}</CardTitle>
        {description && (
          <p className="text-ui text-muted-foreground leading-normal">{description}</p>
        )}
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">{body}</CardContent>
    </Card>
  );
}

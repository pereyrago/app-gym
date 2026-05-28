"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type ChartContainerProps = {
  title: string;
  summary: string;
  children: React.ReactNode;
  tableHeaders?: string[];
  tableRows?: string[][];
  className?: string;
};

export function ChartContainer({
  title,
  summary,
  children,
  tableHeaders,
  tableRows,
  className,
}: ChartContainerProps) {
  const [tableOpen, setTableOpen] = useState(false);
  const tableId = useId();
  const hasTable = Boolean(tableHeaders?.length && tableRows?.length);

  return (
    <div className={cn("space-y-2", className)}>
      <div role="img" aria-label={`${title}. ${summary}`}>
        {children}
      </div>
      {hasTable && (
        <>
          <button
            type="button"
            className="text-ui-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            aria-expanded={tableOpen}
            aria-controls={tableId}
            onClick={() => setTableOpen((o) => !o)}
          >
            {tableOpen ? "Ocultar tabla de datos" : "Ver tabla de datos"}
          </button>
          {tableOpen && (
            <div
              id={tableId}
              className="max-h-48 overflow-auto rounded-md border border-border/80"
            >
              <table className="w-full text-ui-sm">
                <thead className="sticky top-0 bg-muted">
                  <tr>
                    {tableHeaders!.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows!.map((row, i) => (
                    <tr key={i} className="border-t border-border/60">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 tabular-nums text-muted-foreground">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { StudentRankingRow } from "@/features/dashboard/types";

type SortKey = keyof StudentRankingRow;

type StudentsRankingTableProps = {
  data: StudentRankingRow[];
  emptyMessage?: string;
};

export function StudentsRankingTable({
  data,
  emptyMessage = "Sin datos",
}: StudentsRankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("classes_count");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const arr = [...data];
    arr.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number")
        return sortAsc ? aVal - bVal : bVal - aVal;
      if (typeof aVal === "string" && typeof bVal === "string")
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortAsc ? 1 : -1;
      if (bVal == null) return sortAsc ? -1 : 1;
      return 0;
    });
    return arr;
  }, [data, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((x) => !x);
    else {
      setSortKey(key);
      setSortAsc(key === "student_name");
    }
  };

  const sortAriaLabel = (column: SortKey, label: string) => {
    if (sortKey !== column) return `Ordenar por ${label}`;
    return sortAsc ? `Ordenar ${label} descendente` : `Ordenar ${label} ascendente`;
  };

  const SortIcon = ({ column }: { column: SortKey }) =>
    sortKey === column ? (
      sortAsc ? (
        <ArrowUp className="ml-1 h-3.5 w-3.5" aria-hidden />
      ) : (
        <ArrowDown className="ml-1 h-3.5 w-3.5" aria-hidden />
      )
    ) : (
      <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-50" aria-hidden />
    );

  if (!data.length) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const sortableHead = (key: SortKey, label: string, align: "left" | "right" = "right") => (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={align === "right" ? "-mr-2 h-8 font-medium" : "-ml-2 h-8 font-medium"}
        onClick={() => toggleSort(key)}
        aria-label={sortAriaLabel(key, label)}
      >
        {label}
        <SortIcon column={key} />
      </Button>
    </TableHead>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {sortableHead("student_name", "Alumno", "left")}
          {sortableHead("classes_count", "Clases")}
          {sortableHead("cancellations_count", "Canceló")}
          {sortableHead("last_class_date", "Última clase")}
          {sortableHead("created_at", "Antigüedad")}
          {sortableHead("days_since_last_class", "Días sin asistir")}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.student_id}>
            <TableCell className="font-medium capitalize">{row.student_name}</TableCell>
            <TableCell className="text-right tabular-nums">{row.classes_count}</TableCell>
            <TableCell className="text-right tabular-nums">{row.cancellations_count}</TableCell>
            <TableCell className="text-right text-muted-foreground">
              {row.last_class_date
                ? format(parseISO(row.last_class_date), "d MMM", { locale: es })
                : "—"}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {row.created_at ? format(parseISO(row.created_at), "d MMM yyyy", { locale: es }) : "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {row.days_since_last_class ?? "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

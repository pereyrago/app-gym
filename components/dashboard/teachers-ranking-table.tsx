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
import type { TeacherPerformanceRow } from "@/features/dashboard/types";

type SortKey = keyof TeacherPerformanceRow;

type TeachersRankingTableProps = {
  data: TeacherPerformanceRow[];
  emptyMessage?: string;
};

export function TeachersRankingTable({
  data,
  emptyMessage = "Sin datos",
}: TeachersRankingTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("total_attendances");
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
      setSortAsc(key === "teacher_name");
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

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 h-8 font-medium"
              onClick={() => toggleSort("teacher_name")}
              aria-label={sortAriaLabel("teacher_name", "profesor")}
            >
              Profesor
              <SortIcon column="teacher_name" />
            </Button>
          </TableHead>
          <TableHead className="text-left">Mail</TableHead>
          <TableHead className="text-left">DNI</TableHead>
          <TableHead className="text-left">Teléfono</TableHead>
          <TableHead className="text-right">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-mr-2 h-8 font-medium"
              onClick={() => toggleSort("classes_count")}
              aria-label={sortAriaLabel("classes_count", "clases")}
            >
              Clases
              <SortIcon column="classes_count" />
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-mr-2 h-8 font-medium"
              onClick={() => toggleSort("unique_students")}
              aria-label={sortAriaLabel("unique_students", "alumnos únicos")}
            >
              Alumnos únicos
              <SortIcon column="unique_students" />
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-mr-2 h-8 font-medium"
              onClick={() => toggleSort("total_attendances")}
              aria-label={sortAriaLabel("total_attendances", "asistencias")}
            >
              Asistencias
              <SortIcon column="total_attendances" />
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-mr-2 h-8 font-medium"
              onClick={() => toggleSort("avg_per_class")}
              aria-label={sortAriaLabel("avg_per_class", "promedio por clase")}
            >
              Prom. por clase
              <SortIcon column="avg_per_class" />
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-mr-2 h-8 font-medium"
              onClick={() => toggleSort("last_class_date")}
              aria-label={sortAriaLabel("last_class_date", "última clase")}
            >
              Última clase
              <SortIcon column="last_class_date" />
            </Button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row) => (
          <TableRow key={row.teacher_id}>
            <TableCell className="font-medium capitalize">{row.teacher_name}</TableCell>
            <TableCell className="text-left text-muted-foreground text-[12px]">
              {row.teacher_email ?? "—"}
            </TableCell>
            <TableCell className="text-left text-muted-foreground tabular-nums">
              {row.teacher_dni ?? "—"}
            </TableCell>
            <TableCell className="text-left text-muted-foreground tabular-nums">
              {row.teacher_phone ?? "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">{row.classes_count}</TableCell>
            <TableCell className="text-right tabular-nums">{row.unique_students}</TableCell>
            <TableCell className="text-right tabular-nums">{row.total_attendances}</TableCell>
            <TableCell className="text-right tabular-nums">
              {row.avg_per_class.toFixed(1)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {row.last_class_date
                ? format(parseISO(row.last_class_date), "d MMM", { locale: es })
                : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Period } from "@/types";

interface PeriodsTableProps {
  periods: Period[];
}

export function PeriodsTable({ periods }: PeriodsTableProps) {
  if (periods.length === 0) {
    return (
      <div className="rounded border border-border/80 p-6 text-center text-[13px] text-muted-foreground">
        No hay períodos. Crea uno para organizar las clases por mes o ciclo.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Inicio</TableHead>
          <TableHead>Fin</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {periods.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium capitalize">{p.name}</TableCell>
            <TableCell>{format(new Date(p.start_date), "d MMM", { locale: es })}</TableCell>
            <TableCell>{format(new Date(p.end_date), "d MMM", { locale: es })}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

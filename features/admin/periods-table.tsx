"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { EditPeriodDialog } from "./edit-period-dialog";

interface PeriodsTableProps {
  periods: Period[];
}

export function PeriodsTable({ periods }: PeriodsTableProps) {
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);

  if (periods.length === 0) {
    return (
      <div className="rounded border border-border/80 p-6 text-center text-[13px] text-muted-foreground">
        No hay períodos. Crea uno para organizar las clases por mes o ciclo.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Inicio</TableHead>
            <TableHead>Fin</TableHead>
            <TableHead className="w-[100px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {periods.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium capitalize">{p.name}</TableCell>
              <TableCell>{format(new Date(p.start_date + "T12:00:00"), "d MMM", { locale: es })}</TableCell>
              <TableCell>{format(new Date(p.end_date + "T12:00:00"), "d MMM", { locale: es })}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingPeriod(p)}
                >
                  <Pencil className="h-4 w-4" />
                  <span className="sr-only">Editar</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingPeriod && (
        <EditPeriodDialog
          period={editingPeriod}
          open={!!editingPeriod}
          onOpenChange={(open) => !open && setEditingPeriod(null)}
        />
      )}
    </>
  );
}

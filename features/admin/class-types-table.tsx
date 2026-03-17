"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClassType } from "@/types";
import { DeleteClassTypeButton } from "./delete-class-type-button";

interface ClassTypesTableProps {
  classTypes: ClassType[];
}

export function ClassTypesTable({ classTypes }: ClassTypesTableProps) {
  if (classTypes.length === 0) {
    return (
      <div className="rounded border border-border/80 p-6 text-center text-[13px] text-muted-foreground">
        No hay tipos de clase. Crea uno para que los profesores puedan asignarlos al crear clases.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead className="w-[100px]" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {classTypes.map((ct) => (
          <TableRow key={ct.id}>
            <TableCell className="font-medium capitalize">{ct.name}</TableCell>
            <TableCell>
              <DeleteClassTypeButton classTypeId={ct.id} classTypeName={ct.name} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { classCanBeEdited } from "@/lib/class-utils";
import type { Period } from "@/types";
import type { ClassWithType } from "@/types";
import { formatClassDate } from "@/lib/app-timezone";

interface TeacherClassesViewProps {
  teacherId: string;
  teacherName: string;
  periods: Period[];
  selectedPeriodId: string | null;
  classes: ClassWithType[];
}

export function TeacherClassesView({
  teacherId,
  periods,
  selectedPeriodId,
  classes,
}: TeacherClassesViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  function onPeriodChange(periodId: string) {
    const params = new URLSearchParams();
    params.set("periodId", periodId);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (periods.length === 0) {
    return (
      <p className="text-muted-foreground">
        No hay períodos. Crea uno en{" "}
        <Link href="/admin/periods" className="underline">
          Períodos
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="period-select" className="text-sm font-medium">
          Período
        </label>
        <Select value={selectedPeriodId ?? ""} onValueChange={onPeriodChange}>
          <SelectTrigger id="period-select" className="w-[200px]">
            <SelectValue placeholder="Seleccionar período" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {classes.length === 0 ? (
        <p className="rounded-md border p-6 text-center text-muted-foreground">
          No hay clases en este período.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Hora / Duración</TableHead>
              <TableHead>Asistentes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((c) => {
              const editable = classCanBeEdited(
                c.class_date,
                String(c.start_time ?? "09:00").slice(0, 5)
              );
              return (
                <TableRow key={c.id}>
                  <TableCell>{formatClassDate(c.class_date)}</TableCell>
                  <TableCell className="font-medium capitalize">
                    {c.class_types?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[12px]">
                    {c.start_time?.slice(0, 5) ?? "—"} · {c.duration_minutes ?? "—"} min
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={editable ? "secondary" : "outline"}
                      size="sm"
                      className="w-full transition-colors duration-200 ease-in-out"
                      asChild
                    >
                      <Link href={`/admin/teachers/${teacherId}/classes/${c.id}`}>
                        {editable ? "Editar" : "Ver"}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

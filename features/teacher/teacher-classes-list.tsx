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
import { formatClassDate } from "@/lib/app-timezone";
import type { Period } from "@/types";
import type { ClassWithType } from "@/types";

interface TeacherClassesListProps {
  teacherId: string;
  periods: Period[];
  selectedPeriodId: string | null;
  classes: ClassWithType[];
}

export function TeacherClassesList({
  teacherId,
  periods,
  selectedPeriodId,
  classes,
}: TeacherClassesListProps) {
  const router = useRouter();
  const pathname = usePathname();

  function onPeriodChange(periodId: string) {
    const params = new URLSearchParams();
    params.set("periodId", periodId);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (periods.length === 0) {
    return (
      <p className="text-muted-foreground">No hay períodos. Pide al administrador que cree uno.</p>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="teacher-period-select" className="text-sm font-medium">
          Período
        </label>
        <Select value={selectedPeriodId ?? ""} onValueChange={onPeriodChange}>
          <SelectTrigger id="teacher-period-select" className="w-[200px]">
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
      {classes.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-[rgb(225,43,43)]" aria-hidden />
            Cancelada por profesor
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-amber-500" aria-hidden />
            Cancelada por alumno
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 shrink-0 rounded-sm bg-green-500" aria-hidden />
            Realizada
          </span>
        </div>
      )}
      {classes.length === 0 ? (
        <p className="rounded border border-border/80 p-6 text-center text-[13px] text-muted-foreground">
          No hay clases en este período. Crea una con el botón &quot;Nueva clase&quot;.
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
              const cancelledByStudent = c.status === "cancel_by_student";
              const cancelledByTeacher = c.status === "cancel_by_teacher";
              const cancelledButtonClass = cancelledByStudent
                ? "w-full border-amber-500 bg-amber-500 text-white hover:bg-amber-600 hover:border-amber-600 dark:bg-amber-500 dark:text-white dark:hover:bg-amber-600"
                : cancelledByTeacher
                  ? "w-full border-[rgb(225,43,43)] bg-[rgb(225,43,43)] text-white hover:bg-[rgb(200,35,35)] hover:border-[rgb(200,35,35)] dark:bg-[rgb(225,43,43)] dark:text-white dark:hover:bg-[rgb(200,35,35)]"
                  : "w-full transition-colors duration-200 ease-in-out";
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
                      variant={cancelledByStudent || cancelledByTeacher ? "outline" : "secondary"}
                      size="sm"
                      className={cancelledButtonClass}
                      asChild
                    >
                      <Link href={`/teacher/classes/${c.id}`}>Editar</Link>
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

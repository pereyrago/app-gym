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
import type { Period } from "@/types";
import type { StudentPeriodClassRow } from "@/repositories/classes";
import { formatClassDate } from "@/lib/app-timezone";
import { cn } from "@/lib/utils";

interface AdminStudentClassesViewProps {
  periods: Period[];
  selectedPeriodId: string | null;
  rows: StudentPeriodClassRow[];
}

function attendanceText(row: StudentPeriodClassRow): string {
  if (row.attendance === "attended") return "Asistió";
  const extra = row.absenceReason ? ` (${row.absenceReason})` : "";
  return `No asistió${extra}`;
}

export function AdminStudentClassesView({
  periods,
  selectedPeriodId,
  rows,
}: AdminStudentClassesViewProps) {
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
        No hay períodos. Creá uno en{" "}
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
        <label htmlFor="student-period-select" className="text-sm font-medium">
          Período
        </label>
        <Select value={selectedPeriodId ?? ""} onValueChange={onPeriodChange}>
          <SelectTrigger id="student-period-select" className="w-[220px]">
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
      {rows.length === 0 ? (
        <p className="rounded-md border p-6 text-center text-muted-foreground">
          No hay asistencias ni faltas registradas para este alumno en este período.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border/80">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Hora / Duración</TableHead>
                <TableHead>Asistencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const c = row.class;
                const attended = row.attendance === "attended";
                return (
                  <TableRow key={c.id}>
                    <TableCell>{formatClassDate(c.class_date)}</TableCell>
                    <TableCell className="font-medium capitalize">
                      {c.class_types?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">
                      {c.start_time?.slice(0, 5) ?? "—"} · {c.duration_minutes ?? "—"} min
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-[13px] font-medium",
                        attended
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {attendanceText(row)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

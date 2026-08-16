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
import { Badge } from "@/components/ui/badge";
import { formatClassDate } from "@/lib/app-timezone";
import type { Period, Student } from "@/types";
import type { ClassWithType } from "@/types";

interface TeacherClassesListProps {
  teacherId: string;
  periods: Period[];
  selectedPeriodId: string | null;
  students: Student[];
  selectedStudentId: string | null;
  classes: ClassWithType[];
}

export function TeacherClassesList({
  teacherId,
  periods,
  selectedPeriodId,
  students,
  selectedStudentId,
  classes,
}: TeacherClassesListProps) {
  const router = useRouter();
  const pathname = usePathname();

  function onPeriodChange(periodId: string) {
    const params = new URLSearchParams();
    params.set("periodId", periodId);
    if (selectedStudentId) params.set("studentId", selectedStudentId);
    router.push(`${pathname}?${params.toString()}`);
  }

  if (periods.length === 0) {
    return (
      <p className="text-muted-foreground">No hay períodos. Pide al administrador que cree uno.</p>
    );
  }

  function onStudentChange(studentId: string) {
    const params = new URLSearchParams();
    if (selectedPeriodId) params.set("periodId", selectedPeriodId);
    params.set("studentId", studentId);
    router.push(`${pathname}?${params.toString()}`);
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
        <div className="flex flex-wrap items-center gap-2 ml-10">
          <label htmlFor="teacher-student-select" className="text-sm font-medium">
            Alumno
          </label>
          <Select value={selectedStudentId ?? ""} onValueChange={onStudentChange}>
            <SelectTrigger id="teacher-student-select" className="w-[200px]">
              <SelectValue placeholder="Seleccionar alumno" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
              const isCancelled = cancelledByStudent || cancelledByTeacher;

              return (
                <TableRow key={c.id}>
                  <TableCell>{formatClassDate(c.class_date)}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{c.class_types?.name ?? "—"}</span>
                      {cancelledByStudent && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400 font-normal px-1.5 py-0"
                        >
                          Canc. alumno
                        </Badge>
                      )}
                      {cancelledByTeacher && (
                        <Badge
                          variant="outline"
                          className="border-red-500/40 bg-red-500/10 text-[10px] text-red-700 dark:text-red-400 font-normal px-1.5 py-0"
                        >
                          Canc. profesor
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[12px]">
                    {c.start_time?.slice(0, 5) ?? "—"} · {c.duration_minutes ?? "—"} min
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={isCancelled ? "outline" : "secondary"}
                      size="sm"
                      className="w-full transition-colors"
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

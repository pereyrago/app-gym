"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { confirmStudentAction, rejectStudentAction } from "@/app/teacher/students/actions";
import { useToast } from "@/hooks/use-toast";
import { Info } from "lucide-react";

type PendingAttendance = {
  id: string;
  student_id: string;
  students?: { full_name: string; email: string | null; status?: string } | null;
};

interface ClassPendingConfirmProps {
  classId: string;
  pending: PendingAttendance[];
}

export function ClassPendingConfirm({ classId, pending }: ClassPendingConfirmProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  if (pending.length === 0) return null;

  function handleConfirm(studentId: string) {
    startTransition(async () => {
      try {
        await confirmStudentAction(studentId, classId);
        toast({ title: "Alumno confirmado" });
        router.refresh();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : undefined,
          variant: "destructive",
        });
      }
    });
  }

  function handleReject(studentId: string) {
    startTransition(async () => {
      try {
        await rejectStudentAction(studentId, classId);
        toast({ title: "Alumno rechazado y quitado de la asistencia" });
        router.refresh();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : undefined,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-1.5 text-sm font-medium text-amber-700 dark:text-amber-400">
        <Info className="h-4 w-4 shrink-0" aria-hidden />
        Pendientes
      </h3>
      <ul className="space-y-2">
        {pending.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50/50 py-2 pl-3 pr-2 dark:border-amber-800 dark:bg-amber-950/30"
          >
            <span className="text-sm font-medium capitalize">
              {a.students?.full_name ?? "Alumno"}
            </span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[12px]"
                onClick={() => handleConfirm(a.student_id)}
                disabled={isPending}
              >
                Aceptar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-[12px] text-destructive"
                onClick={() => handleReject(a.student_id)}
                disabled={isPending}
              >
                Rechazar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

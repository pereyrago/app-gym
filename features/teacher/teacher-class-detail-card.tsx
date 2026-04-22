"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClassStatusBlock } from "@/features/teacher/class-status-block";
import { ClassAttendancesForm } from "@/features/teacher/class-attendances-form";
import { formatClassDate } from "@/lib/app-timezone";
import type { ClassStatus } from "@/types/database.types";
import type { Student, ClassType } from "@/types";
import type { AbsenceDetail } from "@/repositories/attendances";
import { MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditClassDialog } from "./edit-class-dialog";
import { deleteClassAction } from "@/app/teacher/classes/[classId]/actions";
import { useToast } from "@/hooks/use-toast";

interface TeacherClassDetailCardProps {
  classId: string;
  classTypeId: string;
  classTypeName: string;
  classDate: string;
  startTime: string | null;
  durationMinutes: number;
  status: ClassStatus;
  cancellationReason: string | null;
  cancellationReasonType?: string | null;
  cancellationReasonOther?: string | null;
  cancellationReasonObservations?: string | null;
  scope: "individual" | "shared";
  canEdit: boolean;
  students: Student[];
  initialAttendedIds: string[];
  initialAbsentIds: string[];
  absenceDetails: AbsenceDetail[];
  classTypes: ClassType[];
}

export function TeacherClassDetailCard({
  classId,
  classTypeId,
  classTypeName,
  classDate,
  startTime,
  durationMinutes,
  status,
  cancellationReason,
  cancellationReasonType,
  cancellationReasonOther,
  cancellationReasonObservations,
  scope,
  canEdit,
  students,
  initialAttendedIds,
  initialAbsentIds,
  absenceDetails,
  classTypes,
}: TeacherClassDetailCardProps) {
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta clase por completo? Esta acción no se puede deshacer.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteClassAction(classId);
      toast({ title: "Clase eliminada correctamente" });
      router.push("/teacher/classes");
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo eliminar la clase",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle>{classTypeName}</CardTitle>
            <div className="text-[13px] text-muted-foreground">
              {formatClassDate(classDate, "EEEE d MMMM")}
              {startTime != null && (
                <>
                  {" "}
                  · {String(startTime).slice(0, 5)} · {durationMinutes} min
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ClassStatusBlock
              classId={classId}
              status={status}
              cancellationReason={cancellationReason}
              cancellationReasonType={cancellationReasonType}
              cancellationReasonOther={cancellationReasonOther}
              cancellationReasonObservations={cancellationReasonObservations}
              canEdit={canEdit}
              open={statusDialogOpen}
              onOpenChange={setStatusDialogOpen}
            />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                  <span className="sr-only">Acciones de clase</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar datos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar clase
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ClassAttendancesForm
          classId={classId}
          scope={scope}
          students={students}
          initialAttendedIds={initialAttendedIds}
          initialAbsentIds={initialAbsentIds}
          absenceDetails={absenceDetails}
          canEdit={canEdit}
        />
      </CardContent>

      <EditClassDialog
        classId={classId}
        classTypeId={classTypeId}
        classDate={classDate}
        startTime={startTime}
        durationMinutes={durationMinutes}
        classTypes={classTypes}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </Card>
  );
}

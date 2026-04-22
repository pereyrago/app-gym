"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { EditStudentDialog } from "./edit-student-dialog";
import { deleteStudentAction } from "@/app/teacher/students/actions";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/types";

interface StudentDetailActionsProps {
  student: Student;
}

export function StudentDetailActions({ student }: StudentDetailActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${student.full_name}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteStudentAction(student.id);
      toast({ title: "Alumno eliminado correctamente" });
      router.push("/teacher/students");
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo eliminar el alumno",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-[13px]"
        onClick={() => setIsEditDialogOpen(true)}
      >
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        Editar
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-[13px] text-destructive hover:text-destructive"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        )}
        Eliminar
      </Button>

      <EditStudentDialog
        student={student}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
      />
    </div>
  );
}

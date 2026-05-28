"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStudentAction } from "@/app/admin/actions";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface DeleteStudentButtonProps {
  studentId: string;
}

export function DeleteStudentButton({ studentId }: DeleteStudentButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await deleteStudentAction(studentId);
        toast({ title: "Alumno eliminado" });
        setOpen(false);
        router.refresh();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "No se pudo eliminar",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={isPending}
        className="flex w-full items-center px-2 py-1.5 text-sm text-destructive focus:bg-accent focus:text-accent-foreground focus:outline-none"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Eliminar
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Eliminar alumno"
        description="¿Estás seguro de que deseas eliminar este alumno? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        loading={isPending}
        onConfirm={handleConfirm}
      />
    </>
  );
}

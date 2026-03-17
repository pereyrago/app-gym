"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTeacherAction } from "@/app/admin/actions";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DeleteTeacherButtonProps {
  teacherId: string;
}

export function DeleteTeacherButton({ teacherId }: DeleteTeacherButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteTeacherAction(teacherId);
        toast({ title: "Profesor eliminado" });
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
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="flex w-full items-center px-2 py-1.5 text-sm text-destructive focus:bg-accent focus:text-accent-foreground focus:outline-none"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Eliminar
    </button>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteClassTypeAction } from "@/app/admin/class-types/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface DeleteClassTypeButtonProps {
  classTypeId: string;
  classTypeName: string;
}

export function DeleteClassTypeButton({ classTypeId, classTypeName }: DeleteClassTypeButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  function handleConfirm() {
    startTransition(async () => {
      try {
        await deleteClassTypeAction(classTypeId);
        toast({ title: "Tipo de clase eliminado" });
        setOpen(false);
        router.refresh();
      } catch (e) {
        toast({
          title: "Error",
          description:
            e instanceof Error
              ? e.message
              : "No se pudo eliminar. Puede que existan clases con este tipo.",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          <span className="sr-only">Eliminar {classTypeName}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Eliminar tipo de clase</DialogTitle>
          <DialogDescription>
            ¿Eliminar &quot;{classTypeName}&quot;? No se puede eliminar si hay clases que lo usan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isPending}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

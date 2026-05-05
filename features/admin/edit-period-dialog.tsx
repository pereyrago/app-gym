"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updatePeriodSchema, type UpdatePeriodInput } from "@/validations/period";
import { updatePeriodAction, deletePeriodAction } from "@/app/admin/periods/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2 } from "lucide-react";
import type { Period } from "@/types";

interface EditPeriodDialogProps {
  period: Period;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPeriodDialog({ period, open, onOpenChange }: EditPeriodDialogProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<UpdatePeriodInput>({
    resolver: zodResolver(updatePeriodSchema),
    defaultValues: {
      name: period.name,
      start_date: period.start_date,
      end_date: period.end_date,
    },
  });

  async function onSubmit(values: UpdatePeriodInput) {
    if (saving) return;
    setSaving(true);
    try {
      await updatePeriodAction(period.id, values);
      toast({ title: "Período actualizado correctamente" });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo actualizar el período",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este período? Esto podría afectar a las clases asociadas.")) {
      return;
    }
    setDeleting(true);
    try {
      await deletePeriodAction(period.id);
      toast({ title: "Período eliminado" });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo eliminar el período",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="edit-period-desc">
        <DialogHeader>
          <DialogTitle>Editar período</DialogTitle>
          <DialogDescription id="edit-period-desc">
            Modifica el nombre o las fechas del período.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Marzo 2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha inicio</FormLabel>
                  <FormControl>
                    <DatePickerField
                      id="edit-period-start-date"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="dd/mm/aaaa"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha fin</FormLabel>
                  <FormControl>
                    <DatePickerField
                      id="edit-period-end-date"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="dd/mm/aaaa"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={saving || deleting}
                className="gap-2"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>
                  Cancelar
                </Button>
                <Button type="submit" variant="secondary" disabled={saving || deleting}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    "Guardar"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

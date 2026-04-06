"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClassTypeSchema, type CreateClassTypeInput } from "@/validations/class-type";
import { createClassTypeAction } from "@/app/admin/class-types/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2 } from "lucide-react";

export function CreateClassTypeDialog() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const form = useForm<CreateClassTypeInput>({
    resolver: zodResolver(createClassTypeSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: CreateClassTypeInput) {
    if (saving) return;
    setSaving(true);
    try {
      await createClassTypeAction(values);
      toast({ title: "Tipo de clase creado correctamente" });
      setOpen(false);
      form.reset({ name: "" });
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo crear el tipo",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="h-8 rounded px-3 text-[13px] font-medium">
          <Plus className="mr-2 h-3.5 w-3.5" />
          Nuevo tipo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby="create-class-type-desc">
        <DialogHeader>
          <DialogTitle>Crear tipo de clase</DialogTitle>
          <DialogDescription id="create-class-type-desc">
            Ej: Yoga, Pilates, Funcional, Spinning. Los profesores elegirán este tipo al crear una
            clase.
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
                    <Input placeholder="Yoga" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" variant="secondary" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando…
                  </>
                ) : (
                  "Crear"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

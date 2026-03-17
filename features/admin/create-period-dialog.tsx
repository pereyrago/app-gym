"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPeriodSchema, type CreatePeriodInput } from "@/validations/period";
import { createPeriodAction } from "@/app/admin/periods/actions";
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
import { Plus } from "lucide-react";

export function CreatePeriodDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<CreatePeriodInput>({
    resolver: zodResolver(createPeriodSchema),
    defaultValues: {
      name: "",
      start_date: "",
      end_date: "",
    },
  });

  async function onSubmit(values: CreatePeriodInput) {
    try {
      await createPeriodAction(values);
      toast({ title: "Período creado correctamente" });
      setOpen(false);
      form.reset();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo crear el período",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="h-8 rounded px-3 text-[13px] font-medium">
          <Plus className="mr-2 h-3.5 w-3.5" />
          Nuevo período
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby="create-period-desc">
        <DialogHeader>
          <DialogTitle>Crear período</DialogTitle>
          <DialogDescription id="create-period-desc">
            Ej: Marzo 2025, Ciclo 1, etc.
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
                      id="period-start-date"
                      value={field.value}
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
                      id="period-end-date"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="dd/mm/aaaa"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="secondary">
                Crear
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateClassStatusAction } from "@/app/teacher/classes/[classId]/actions";
import type { ClassStatus } from "@/types/database.types";
import type { CancellationReasonType } from "@/types/database.types";
import { cn } from "@/lib/utils";
import { Info, Loader2 } from "lucide-react";

const STATUS_LABELS: Record<ClassStatus, string> = {
  success: "Realizada",
  cancel_by_student: "Cancelada por alumno",
  cancel_by_teacher: "Cancelada por profesor",
};

const REASON_OPTIONS: { value: CancellationReasonType; label: string }[] = [
  { value: "viaje", label: "Viaje" },
  { value: "enfermedad", label: "Enfermedad" },
  { value: "trabajo", label: "Trabajo" },
  { value: "sin_aviso", label: "Sin aviso" },
  { value: "otro", label: "Otro" },
];

interface ClassStatusBlockProps {
  classId: string;
  status: ClassStatus;
  cancellationReason: string | null;
  cancellationReasonType?: string | null;
  cancellationReasonOther?: string | null;
  cancellationReasonObservations?: string | null;
  canEdit: boolean;
  /** Si se pasan, el diálogo se controla desde fuera (ej. para abrirlo con "Cancelar clase"). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ClassStatusBlock({
  classId,
  status,
  cancellationReason,
  cancellationReasonType,
  cancellationReasonOther,
  cancellationReasonObservations,
  canEdit,
  open: controlledOpen,
  onOpenChange: controlledSetOpen,
}: ClassStatusBlockProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledSetOpen != null;
  const open = isControlled ? (controlledOpen ?? false) : internalOpen;
  const setOpen = isControlled ? controlledSetOpen! : setInternalOpen;
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState<ClassStatus>(status);
  const [newReasonType, setNewReasonType] = useState<CancellationReasonType | "">(
    (cancellationReasonType as CancellationReasonType) ?? ""
  );
  const [newReasonOther, setNewReasonOther] = useState(cancellationReasonOther ?? "");
  const [newObservations, setNewObservations] = useState(cancellationReasonObservations ?? "");
  const { toast } = useToast();
  const router = useRouter();

  const isCancelled = status !== "success";
  const reasonChanged =
    newStatus !== "success" &&
    (newReasonType !== (cancellationReasonType ?? "") ||
      newReasonOther !== (cancellationReasonOther ?? "") ||
      newObservations !== (cancellationReasonObservations ?? ""));
  const hasChanges =
    newStatus !== status || (newStatus === "success" ? isCancelled : reasonChanged);

  async function handleSave() {
    if (newStatus !== "success") {
      if (!newReasonType) {
        toast({ title: "Seleccioná un motivo de cancelación", variant: "destructive" });
        return;
      }
      if (newReasonType === "otro" && !newReasonOther.trim()) {
        toast({ title: "Escribí el motivo en el campo Otro", variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    try {
      await updateClassStatusAction(classId, {
        status: newStatus,
        cancellation_reason_type: newStatus === "success" ? null : newReasonType || null,
        cancellation_reason_other:
          newStatus === "success" ? null : newReasonType === "otro" ? newReasonOther.trim() : null,
        cancellation_reason_observations:
          newStatus === "success" ? null : newObservations.trim() || null,
      });
      toast({ title: "Estado actualizado" });
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo actualizar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 font-medium",
            isCancelled && "border-amber-500/50 text-amber-700 dark:text-amber-400"
          )}
          aria-label={
            canEdit && !isCancelled ? "Ver estado o cancelar clase" : "Ver estado de la clase"
          }
          title={canEdit && !isCancelled ? "Clic para ver estado o cancelar la clase" : undefined}
        >
          <Info className="h-3.5 w-3.5" />
          {STATUS_LABELS[status]}
          {canEdit && !isCancelled && (
            <span className="ml-0.5 text-muted-foreground">· clic para cancelar</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby="class-status-desc">
        <DialogHeader>
          <DialogTitle>Estado de la clase</DialogTitle>
        </DialogHeader>
        <div id="class-status-desc" className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Estado actual</p>
            <p className={cn("font-medium", isCancelled && "text-amber-700 dark:text-amber-400")}>
              {STATUS_LABELS[status]}
            </p>
            {isCancelled && cancellationReason && (
              <div className="mt-2 rounded border border-border/80 bg-muted/30 px-3 py-2">
                <p className="text-[12px] font-medium text-muted-foreground">Motivo</p>
                <p className="text-sm">{cancellationReason}</p>
              </div>
            )}
          </div>

          {canEdit && (
            <>
              <hr className="border-border/80" />
              <div className="space-y-3">
                <p className="text-sm font-medium">Cambiar estado</p>
                <div className="flex flex-wrap gap-2">
                  {(["success", "cancel_by_student", "cancel_by_teacher"] as const).map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={newStatus === s ? "secondary" : "outline"}
                      size="sm"
                      className="text-[12px]"
                      onClick={() => {
                        setNewStatus(s);
                        if (s === "success") {
                          setNewReasonType("");
                          setNewReasonOther("");
                          setNewObservations("");
                        }
                      }}
                    >
                      {STATUS_LABELS[s]}
                    </Button>
                  ))}
                </div>
                {newStatus !== "success" && (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Motivo de cancelación (obligatorio)</Label>
                      <div className="flex flex-wrap gap-2">
                        {REASON_OPTIONS.map((opt) => (
                          <Button
                            key={opt.value}
                            type="button"
                            variant={newReasonType === opt.value ? "secondary" : "outline"}
                            size="sm"
                            className="text-[12px]"
                            onClick={() => {
                              setNewReasonType(opt.value);
                              if (opt.value !== "otro") setNewReasonOther("");
                            }}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {newReasonType === "otro" && (
                      <div className="space-y-1">
                        <Label htmlFor="reason-other">Especificar (obligatorio)</Label>
                        <Input
                          id="reason-other"
                          value={newReasonOther}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewReasonOther(e.target.value)
                          }
                          placeholder="Escribí el motivo"
                          className="text-sm"
                          maxLength={300}
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label htmlFor="reason-obs">Observaciones (opcional)</Label>
                      <Textarea
                        id="reason-obs"
                        value={newObservations}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setNewObservations(e.target.value)
                        }
                        placeholder="Ej.: reprogramar la semana que viene"
                        className="min-h-[60px] resize-y text-sm"
                        maxLength={500}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        {canEdit && hasChanges && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  setAttendancesAction,
  setAttendancesWithAbsencesAction,
  cancelClassByTeacherAction,
} from "@/app/teacher/classes/[classId]/actions";
import { confirmStudentAction, rejectStudentAction } from "@/app/teacher/students/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";
import { Info, Loader2, Search } from "lucide-react";
import type { Student } from "@/types";
import type { CancellationReasonType } from "@/types/database.types";
import type { AbsenceDetail } from "@/repositories/attendances";

const REASON_OPTIONS: { value: CancellationReasonType; label: string }[] = [
  { value: "viaje", label: "Viaje" },
  { value: "enfermedad", label: "Enfermedad" },
  { value: "trabajo", label: "Trabajo" },
  { value: "sin_aviso", label: "Sin aviso" },
  { value: "otro", label: "Otro" },
];

const REASON_LABELS: Record<string, string> = Object.fromEntries(
  REASON_OPTIONS.map((o) => [o.value, o.label])
);

function getReasonLabel(d: AbsenceDetail): string {
  if (d.reason_type === "otro" && d.reason_other?.trim()) return d.reason_other.trim();
  return REASON_LABELS[d.reason_type] ?? d.reason_type;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

type DisabledReason = "past_24h";

interface ClassAttendancesFormProps {
  classId: string;
  scope: "individual" | "shared";
  students: Student[];
  initialAttendedIds: string[];
  /** Alumnos vinculados a la clase que no asistieron (tienen falta con motivo). */
  initialAbsentIds: string[];
  /** Detalle del motivo por alumno ausente (para mostrar al hacer clic en Canceló). */
  absenceDetails: AbsenceDetail[];
  canEdit: boolean;
  /** Motivo por el que está deshabilitado (solo cuando canEdit es false). */
  disabledReason?: DisabledReason;
}

export function ClassAttendancesForm({
  classId,
  scope,
  students,
  initialAttendedIds,
  initialAbsentIds,
  absenceDetails,
  canEdit,
  disabledReason,
}: ClassAttendancesFormProps) {
  const [attendedIds, setAttendedIds] = useState<Set<string>>(new Set(initialAttendedIds));
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [cancelReasonDialogOpen, setCancelReasonDialogOpen] = useState(false);
  const [cancelReasonDialogDetail, setCancelReasonDialogDetail] = useState<{
    studentName: string;
    detail: AbsenceDetail;
  } | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReasonType, setCancelReasonType] = useState<CancellationReasonType | "">("");
  const [cancelReasonOther, setCancelReasonOther] = useState("");
  const [cancelObservations, setCancelObservations] = useState("");
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [removedForAbsenceDialog, setRemovedForAbsenceDialog] = useState<string[]>([]);
  const [absentReasons, setAbsentReasons] = useState<
    Record<string, { reason_type: string; reason_other?: string; observations?: string }>
  >({});
  const [isPendingConfirm, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const absentIdsSet = useMemo(() => new Set(initialAbsentIds), [initialAbsentIds]);
  const absenceDetailsByStudent = useMemo(
    () => new Map(absenceDetails.map((d) => [d.student_id, d])),
    [absenceDetails]
  );
  // Sin búsqueda: asistentes + alumnos que cancelaron (vinculados a la clase). Con búsqueda: resultados en todos los alumnos.
  const filteredStudents = useMemo(() => {
    if (search.trim()) {
      const q = normalize(search.trim());
      return students.filter((s) => normalize(s.full_name).includes(q));
    }
    return students.filter((s) => attendedIds.has(s.id) || absentIdsSet.has(s.id));
  }, [students, search, attendedIds, absentIdsSet]);

  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      const aAttended = attendedIds.has(a.id);
      const bAttended = attendedIds.has(b.id);
      if (aAttended && !bAttended) return -1;
      if (!aAttended && bAttended) return 1;
      return a.full_name.localeCompare(b.full_name, "es");
    });
  }, [filteredStudents, attendedIds]);

  function toggleAttendance(studentId: string) {
    if (!canEdit) return;
    setAttendedIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  }

  function openAbsenceDialog(removedIds: string[]) {
    const next: Record<
      string,
      { reason_type: string; reason_other?: string; observations?: string }
    > = {};
    removedIds.forEach((id) => {
      next[id] = { reason_type: "", reason_other: "", observations: "" };
    });
    setAbsentReasons(next);
    setRemovedForAbsenceDialog(removedIds);
    setAbsenceDialogOpen(true);
  }

  async function handleSubmit() {
    if (!canEdit || saving) return;
    const removedIds = initialAttendedIds.filter((id) => !attendedIds.has(id));

    if (removedIds.length > 0) {
      openAbsenceDialog(removedIds);
      return;
    }
    setSaving(true);
    try {
      await setAttendancesAction(classId, Array.from(attendedIds));
      toast({ title: "Asistencias guardadas" });
      router.push("/teacher");
      router.refresh();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudieron guardar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmCancelByTeacher() {
    if (saving) return;
    if (!cancelReasonType) {
      toast({ title: "Seleccioná un motivo de cancelación", variant: "destructive" });
      return;
    }
    if (cancelReasonType === "otro" && !cancelReasonOther.trim()) {
      toast({ title: "Escribí el motivo en el campo Otro", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await cancelClassByTeacherAction(classId, {
        cancellation_reason_type: cancelReasonType,
        cancellation_reason_other: cancelReasonType === "otro" ? cancelReasonOther.trim() : null,
        cancellation_reason_observations: cancelObservations.trim() || null,
      });
      toast({ title: "Clase cancelada por el profesor" });
      setCancelDialogOpen(false);
      setCancelReasonType("");
      setCancelReasonOther("");
      setCancelObservations("");
      router.refresh();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo cancelar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleConfirm(studentId: string) {
    if (isPendingConfirm) return;
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
    if (isPendingConfirm) return;
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

  function setAbsentReason(
    studentId: string,
    field: "reason_type" | "reason_other" | "observations",
    value: string
  ) {
    setAbsentReasons((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
  }

  async function handleSubmitAbsenceReasons() {
    if (saving) return;
    const invalid = removedForAbsenceDialog.find((id) => {
      const r = absentReasons[id];
      if (!r?.reason_type) return true;
      if (r.reason_type === "otro" && !String(r.reason_other ?? "").trim()) return true;
      return false;
    });
    if (invalid) {
      toast({
        title: "Completá el motivo de falta de cada alumno",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const absences = removedForAbsenceDialog.map((student_id) => {
        const r = absentReasons[student_id];
        return {
          student_id,
          reason_type: r!.reason_type,
          reason_other: r!.reason_type === "otro" ? (r.reason_other ?? "").trim() : null,
          observations: (r.observations ?? "").trim() || null,
        };
      });
      await setAttendancesWithAbsencesAction(classId, Array.from(attendedIds), absences);
      toast({ title: "Asistencias y faltas guardadas" });
      setAbsenceDialogOpen(false);
      setRemovedForAbsenceDialog([]);
      setAbsentReasons({});
      router.push("/teacher");
      router.refresh();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudieron guardar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No tienes alumnos. Crea alguno en la sección Alumnos para poder cargar asistencias.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium">{canEdit ? "Marcar asistentes" : "Asistentes"}</h2>
      {!canEdit && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Esta clase ya no puede editarse (pasaron más de 24 horas desde el inicio).
        </p>
      )}
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full min-w-0 pl-10 pr-3"
          aria-label="Buscar alumno"
        />
      </div>
      <div className="rounded-md border border-border/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[100px] text-center">Asistencia</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStudents.map((s) => {
              const pending = s.status === "to_confirm";
              const isAbsent = absentIdsSet.has(s.id) && !attendedIds.has(s.id);
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium capitalize">{s.full_name}</TableCell>
                  <TableCell>
                    {isAbsent ? (
                      <button
                        type="button"
                        onClick={() => {
                          const detail = absenceDetailsByStudent.get(s.id);
                          if (detail) {
                            setCancelReasonDialogDetail({
                              studentName: s.full_name
                                ? `${s.full_name.charAt(0).toUpperCase()}${s.full_name.slice(1).toLowerCase()}`
                                : "Alumno",
                              detail,
                            });
                            setCancelReasonDialogOpen(true);
                          }
                        }}
                        className="text-[13px] font-medium text-destructive underline underline-offset-2 hover:no-underline cursor-pointer"
                      >
                        Canceló
                      </button>
                    ) : pending ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Pendiente
                        </span>
                        {canEdit && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[12px]"
                              onClick={() => handleConfirm(s.id)}
                              disabled={isPendingConfirm}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[12px] text-destructive"
                              onClick={() => handleReject(s.id)}
                              disabled={isPendingConfirm}
                            >
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[13px] text-muted-foreground">Activo</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={attendedIds.has(s.id)}
                      onCheckedChange={() => toggleAttendance(s.id)}
                      disabled={!canEdit}
                      aria-label={`${s.full_name} asistió`}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {sortedStudents.length === 0 && (
        <p className="py-2 text-center text-[13px] text-muted-foreground">
          {search.trim()
            ? `No hay resultados para "${search}"`
            : "No hay asistentes. Busca un alumno por nombre para agregarlo."}
        </p>
      )}
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Guardando…" : "Guardar asistencias"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCancelDialogOpen(true)}
            disabled={saving}
          >
            Cancelar clase
          </Button>
        </div>
      )}

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="cancel-reason-desc">
          <DialogHeader>
            <DialogTitle>Cancelar clase</DialogTitle>
          </DialogHeader>
          <div id="cancel-reason-desc" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              La clase quedará cancelada por el profesor. Los alumnos no tendrán registro de falta.
              Indicá el motivo (obligatorio).
            </p>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <div className="flex flex-wrap gap-2">
                {REASON_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={cancelReasonType === opt.value ? "secondary" : "outline"}
                    size="sm"
                    className="text-[12px]"
                    onClick={() => {
                      setCancelReasonType(opt.value);
                      if (opt.value !== "otro") setCancelReasonOther("");
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            {cancelReasonType === "otro" && (
              <div className="space-y-1">
                <Label htmlFor="cancel-reason-other">Especificar (obligatorio)</Label>
                <Input
                  id="cancel-reason-other"
                  value={cancelReasonOther}
                  onChange={(e) => setCancelReasonOther(e.target.value)}
                  placeholder="Escribí el motivo"
                  className="text-sm"
                  maxLength={300}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="cancel-obs">Observaciones (opcional)</Label>
              <Textarea
                id="cancel-obs"
                value={cancelObservations}
                onChange={(e) => setCancelObservations(e.target.value)}
                placeholder="Ej.: reprogramar la semana que viene"
                className="min-h-[60px] resize-y text-sm"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)} disabled={saving}>
              Volver
            </Button>
            <Button onClick={handleConfirmCancelByTeacher} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando…
                </>
              ) : (
                "Cancelar clase"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelReasonDialogOpen} onOpenChange={setCancelReasonDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Motivo de la cancelación</DialogTitle>
          </DialogHeader>
          {cancelReasonDialogDetail && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {cancelReasonDialogDetail.studentName} no asistió a la clase.
              </p>
              <div>
                <span className="font-medium">Motivo: </span>
                <span>{getReasonLabel(cancelReasonDialogDetail.detail)}</span>
              </div>
              <div>
                <span className="font-medium">Observaciones: </span>
                <span className="text-muted-foreground">
                  {cancelReasonDialogDetail.detail.observations?.trim() || "—"}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCancelReasonDialogOpen(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={absenceDialogOpen} onOpenChange={setAbsenceDialogOpen}>
        <DialogContent className="sm:max-w-lg" aria-describedby="absence-reasons-desc">
          <DialogHeader>
            <DialogTitle>Motivo de falta</DialogTitle>
          </DialogHeader>
          <div id="absence-reasons-desc" className="space-y-4">
            <Tabs defaultValue={removedForAbsenceDialog[0] ?? ""} className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
                {removedForAbsenceDialog.map((studentId) => {
                  const student = students.find((s) => s.id === studentId);
                  const name = student?.full_name
                    ? `${student.full_name.charAt(0).toUpperCase()}${student.full_name.slice(1).toLowerCase()}`
                    : "Alumno";
                  const r = absentReasons[studentId];
                  const complete =
                    r?.reason_type &&
                    (r.reason_type !== "otro" || String(r.reason_other ?? "").trim());
                  return (
                    <TabsTrigger key={studentId} value={studentId} className="text-xs shrink-0">
                      {complete ? "✓ " : ""}
                      {name}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {removedForAbsenceDialog.map((studentId) => {
                const student = students.find((s) => s.id === studentId);
                const name = student?.full_name
                  ? `${student.full_name.charAt(0).toUpperCase()}${student.full_name.slice(1).toLowerCase()}`
                  : "Alumno";
                const r = absentReasons[studentId] ?? {
                  reason_type: "",
                  reason_other: "",
                  observations: "",
                };
                return (
                  <TabsContent key={studentId} value={studentId} className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      {name}, no va a asistir a la clase, ingresa el motivo.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {REASON_OPTIONS.map((opt) => (
                        <Button
                          key={opt.value}
                          type="button"
                          variant={r.reason_type === opt.value ? "secondary" : "outline"}
                          size="sm"
                          className="text-[12px]"
                          onClick={() => {
                            setAbsentReason(studentId, "reason_type", opt.value);
                            if (opt.value !== "otro")
                              setAbsentReason(studentId, "reason_other", "");
                          }}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                    {r.reason_type === "otro" && (
                      <div className="space-y-1">
                        <Label className="text-xs">Especificar (obligatorio)</Label>
                        <Input
                          value={r.reason_other ?? ""}
                          onChange={(e) =>
                            setAbsentReason(studentId, "reason_other", e.target.value)
                          }
                          placeholder="Escribí el motivo"
                          className="text-sm h-8"
                          maxLength={300}
                        />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label className="text-xs">Observaciones (opcional)</Label>
                      <Input
                        value={r.observations ?? ""}
                        onChange={(e) => setAbsentReason(studentId, "observations", e.target.value)}
                        placeholder="Opcional"
                        className="text-sm h-8"
                        maxLength={200}
                      />
                    </div>
                  </TabsContent>
                );
              })}
            </Tabs>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAbsenceDialogOpen(false)} disabled={saving}>
              Volver
            </Button>
            <Button
              onClick={handleSubmitAbsenceReasons}
              disabled={
                saving ||
                !removedForAbsenceDialog.every((id) => {
                  const r = absentReasons[id];
                  return (
                    r?.reason_type &&
                    (r.reason_type !== "otro" || String(r.reason_other ?? "").trim())
                  );
                })
              }
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                "Guardar faltas y asistencias"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

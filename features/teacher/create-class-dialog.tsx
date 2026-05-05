"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMultipleClassesSchema,
  type CreateMultipleClassesInput,
  DURATION_MINUTES_OPTIONS,
} from "@/validations/class";
import { createClassAction } from "@/app/teacher/classes/actions";
import { getMyStudentsAction } from "@/app/teacher/students/actions";
import { getTeacherStudentGroupsAction } from "@/app/teacher/student-groups/actions";
import type { TeacherStudentGroupWithStudents } from "@/repositories/teacher-student-groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Info, PlusCircle, Plus, ChevronRight, Loader2, Search, X, CalendarIcon } from "lucide-react";
import type { ClassType } from "@/types";
import type { Period } from "@/types";
import type { Student } from "@/types";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

interface CreateClassDialogProps {
  teacherId: string;
  /** Período actual (no editable por el profesor). */
  currentPeriod: Period | null;
  classTypes: ClassType[];
}

const STEP_LABELS = ["Datos de la clase", "Asistentes"];

export function CreateClassDialog({
  teacherId,
  currentPeriod,
  classTypes,
}: CreateClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchStep2, setSearchStep2] = useState("");
  /** false = 1:1 (un solo alumno); true = clase compartida (varios) */
  const [isSharedMode, setIsSharedMode] = useState(false);
  /** Espejo síncrono de `isSharedMode` para lógica en handlers (evita closures viejos). */
  const isSharedModeRef = useRef(false);
  const [groups, setGroups] = useState<TeacherStudentGroupWithStudents[]>([]);
  const [groupSelectNonce, setGroupSelectNonce] = useState(0);
  const { toast } = useToast();

  const filteredStudentsStep2 = useMemo(() => {
    if (!searchStep2.trim()) return students;
    const q = normalizeName(searchStep2.trim());
    return students.filter((s) => normalizeName(s.full_name).includes(q));
  }, [students, searchStep2]);

  const form = useForm<CreateMultipleClassesInput>({
    resolver: zodResolver(createMultipleClassesSchema),
    defaultValues: {
      class_type_id: "",
      class_dates: [],
      start_time: "09:00",
      duration_minutes: 60,
    },
  });

  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedStudentIds(new Set());
      setStudents([]);
      setSearchStep2("");
      setIsSharedMode(false);
      isSharedModeRef.current = false;
      form.reset({ class_type_id: "", class_dates: [], start_time: "09:00", duration_minutes: 60 });
    }
  }, [open, form]);

  useEffect(() => {
    isSharedModeRef.current = isSharedMode;
  }, [isSharedMode]);

  useEffect(() => {
    if (open && step === 2) {
      setLoadingStudents(true);
      Promise.all([getMyStudentsAction(), getTeacherStudentGroupsAction()])
        .then(([list, grp]) => {
          setStudents([...list].sort((a, b) => a.full_name.localeCompare(b.full_name, "es")));
          setGroups(grp);
        })
        .catch(() => toast({ title: "Error al cargar alumnos", variant: "destructive" }))
        .finally(() => setLoadingStudents(false));
    }
  }, [open, step, toast]);

  function applyPredefinedGroup(groupId: string) {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    const allowed = new Set(students.map((s) => s.id));
    const ids = group.student_ids.filter((id) => allowed.has(id));
    if (ids.length === 0) {
      toast({
        title: "Ningún alumno del grupo está en tu lista actual",
        variant: "destructive",
      });
      return;
    }
    if (ids.length > 1) {
      isSharedModeRef.current = true;
      setIsSharedMode(true);
      setSelectedStudentIds((prev) => new Set([...prev, ...ids]));
    } else {
      const only = ids[0];
      setSelectedStudentIds((prev) => {
        const append = isSharedModeRef.current || prev.size > 1;
        if (append) return new Set([...prev, only]);
        return new Set([only]);
      });
    }
    setGroupSelectNonce((n) => n + 1);
  }

  async function onSubmitStep1() {
    const valid = await form.trigger(["class_type_id", "class_dates", "start_time", "duration_minutes"]);
    if (valid) {
      setStep(2);
    }
  }

  function toggleStudent(id: string) {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (isSharedModeRef.current) next.add(id);
      else return new Set([id]); // 1:1: solo uno seleccionado
      return next;
    });
  }

  async function handleConfirmStep2() {
    if (saving) return;
    const values = form.getValues();
    const valid = await form.trigger();
    if (!valid) return;
    setSaving(true);
    try {
      await createClassAction({
        ...values,
        teacher_id: teacherId,
        student_ids: Array.from(selectedStudentIds),
      });
      toast({ title: values.class_dates.length > 1 ? "Clases creadas" : "Clase creada" });
      setOpen(false);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo crear la clase",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  function handleSkipStep2() {
    setOpen(false);
  }

  const canCreate = classTypes.length > 0;

  const selectedDates = form.watch("class_dates");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className="h-8 rounded px-3 text-[13px] font-medium"
          disabled={!canCreate}
        >
          <Plus className="mr-.5 h-3.5 w-3.5" />
          Crear clase
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn("sm:max-w-md", step === 2 && "sm:max-w-lg")}
        aria-describedby="create-class-desc"
      >
        <DialogHeader>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            {STEP_LABELS.map((label, i) => (
              <span key={label} className="flex items-center gap-1">
                <span className={cn("font-medium", step === i + 1 && "text-foreground")}>
                  {i + 1}. {label}
                </span>
                {i < STEP_LABELS.length - 1 && <ChevronRight className="h-3 w-3" />}
              </span>
            ))}
          </div>
          <DialogTitle>{step === 1 ? "Crear clase" : "Seleccionar asistentes"}</DialogTitle>
          <DialogDescription id="create-class-desc">
            {step === 1
              ? "Podés seleccionar varias fechas para crear varias clases de una vez."
              : isSharedMode
                ? "Selecciona todos los alumnos que asisten a esta clase compartida."
                : "Clase individual (1:1). Selecciona el alumno o agrega más para clase compartida."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitStep1)} className="space-y-4">
                {currentPeriod ? (
                  <div className="rounded border border-border/80 bg-muted/30 px-3 py-2 text-[13px]">
                    <span className="font-medium text-muted-foreground">Período sugerido: </span>
                    {currentPeriod.name}
                  </div>
                ) : (
                  <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400">
                    <span className="font-semibold">Nota:</span> No hay un período activo para hoy. Asegúrate de que las fechas que elijas tengan un período creado por el admin.
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="class_type_id"
                  render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de clase</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classTypes.map((ct) => (
                                <SelectItem key={ct.id} value={ct.id}>
                                  {ct.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="class_dates"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fechas</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value?.length && "text-muted-foreground"
                                  )}
                                >
                                  {field.value?.length > 0 ? (
                                    field.value.length === 1 ? (
                                      format(parseISO(field.value[0]), "PPP", { locale: es })
                                    ) : (
                                      `${field.value.length} fechas seleccionadas`
                                    )
                                  ) : (
                                    <span>Seleccionar fechas</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="multiple"
                                selected={(field.value || []).map(d => parseISO(d))}
                                onSelect={(dates) => {
                                  const dateStrings = (dates || []).map(d => format(d, "yyyy-MM-dd"));
                                  field.onChange(dateStrings);
                                }}
                                disabled={(date) =>
                                  date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                          {(field.value || []).length > 1 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {[...(field.value || [])].sort().map(d => (
                                <Badge key={d} variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {format(parseISO(d), "dd/MM", { locale: es })}
                                  <button
                                    type="button"
                                    className="ml-1 hover:text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      field.onChange(field.value.filter(v => v !== d));
                                    }}
                                  >
                                    <X className="h-2 w-2" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hora de inicio</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              value={field.value ?? "09:00"}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              ref={field.ref}
                              name={field.name}
                              aria-label="Hora de inicio de la clase"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duración (minutos)</FormLabel>
                          <Select
                            value={field.value?.toString() ?? ""}
                            onValueChange={(v) => field.onChange(Number(v))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar duración" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DURATION_MINUTES_OPTIONS.map((m) => (
                                <SelectItem key={m} value={m.toString()}>
                                  {m} min
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" variant="secondary">
                        Siguiente
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </>
            )}
        {step === 2 && (
          <>
            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
              </div>
            ) : students.length === 0 ? (
              <p className="py-4 text-[13px] text-muted-foreground">
                No tienes alumnos cargados. Puedes omitir y cargar asistentes después.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-medium">
                    {isSharedMode ? "Alumnos de la clase compartida" : "Alumno (1:1)"}
                  </h2>
                  {!isSharedMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-[12px]"
                      onClick={() => {
                        isSharedModeRef.current = true;
                        setIsSharedMode(true);
                      }}
                    >
                      <PlusCircle className="h-3.5 w-3.5" />
                      Agregar alumnos
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
                  {groups.length > 0 && (
                    <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-[240px]">
                      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Grupo
                      </span>
                      <Select
                        key={groupSelectNonce}
                        onValueChange={(v) => applyPredefinedGroup(v)}
                      >
                        <SelectTrigger className="h-9 text-[13px]" aria-label="Agregar alumnos por grupo">
                          <SelectValue placeholder="Agregar por grupo…" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                              {g.student_ids.length > 0
                                ? ` (${g.student_ids.length})`
                                : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar por nombre..."
                      value={searchStep2}
                      onChange={(e) => setSearchStep2(e.target.value)}
                      className="h-9 w-full min-w-0 pl-10 pr-3"
                      aria-label="Buscar alumno"
                    />
                  </div>
                </div>
                <div className="rounded-md border border-border/80 max-h-[220px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-[100px] text-center">Asistencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudentsStep2.map((s) => {
                        const selected = selectedStudentIds.has(s.id);
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium capitalize">{s.full_name}</TableCell>
                            <TableCell>
                              <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                                {s.status === "to_confirm" ? (
                                  <>
                                    <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                    Pendiente
                                  </>
                                ) : (
                                  "Activo"
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleStudent(s.id)}
                                aria-label={`${s.full_name} asistió`}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {filteredStudentsStep2.length === 0 && (
                  <p className="py-2 text-center text-[13px] text-muted-foreground">
                    No hay resultados para &quot;{searchStep2}&quot;
                  </p>
                )}
                {selectedStudentIds.size > 0 && (
                  <div className="space-y-2">
                    <p className="text-[12px] font-medium text-muted-foreground">
                      Seleccionados ({selectedStudentIds.size})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {students
                        .filter((s) => selectedStudentIds.has(s.id))
                        .map((s) => (
                          <Badge
                            key={s.id}
                            variant="secondary"
                            className="cursor-pointer gap-1 py-1.5 pl-2.5 pr-1.5 text-[13px] transition-colors hover:bg-destructive/20 hover:text-destructive"
                            onClick={() => toggleStudent(s.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleStudent(s.id);
                              }
                            }}
                          >
                            <span className="capitalize">{s.full_name}</span>
                            <span
                              className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                              aria-hidden
                            >
                              <X className="h-3 w-3" />
                            </span>
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={handleSkipStep2} disabled={saving}>
                Cancelar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleConfirmStep2}
                disabled={saving || loadingStudents}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando…
                  </>
                ) : (
                  "Crear clase"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

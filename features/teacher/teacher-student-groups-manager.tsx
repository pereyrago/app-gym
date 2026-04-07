"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/types";
import type { TeacherStudentGroupWithStudents } from "@/repositories/teacher-student-groups";
import {
  createTeacherStudentGroupAction,
  deleteTeacherStudentGroupAction,
  updateTeacherStudentGroupAction,
} from "@/app/teacher/student-groups/actions";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

interface TeacherStudentGroupsManagerProps {
  initialGroups: TeacherStudentGroupWithStudents[];
  students: Student[];
}

export function TeacherStudentGroupsManager({
  initialGroups,
  students,
}: TeacherStudentGroupsManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TeacherStudentGroupWithStudents | null>(null);
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = normalizeName(search.trim());
    return students.filter((s) => normalizeName(s.full_name).includes(q));
  }, [students, search]);

  function openCreate() {
    setEditingGroup(null);
    setName("");
    setSelectedIds(new Set());
    setSearch("");
    setEditorOpen(true);
  }

  function openEdit(g: TeacherStudentGroupWithStudents) {
    setEditingGroup(g);
    setName(g.name);
    setSelectedIds(new Set(g.student_ids));
    setSearch("");
    setEditorOpen(true);
  }

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast({ title: "Indica un nombre para el grupo", variant: "destructive" });
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const ids = Array.from(selectedIds);
      if (editingGroup) {
        await updateTeacherStudentGroupAction({
          id: editingGroup.id,
          name: trimmed,
          student_ids: ids,
        });
        toast({ title: "Grupo actualizado" });
      } else {
        await createTeacherStudentGroupAction({ name: trimmed, student_ids: ids });
        toast({ title: "Grupo creado" });
      }
      setEditorOpen(false);
      setEditingGroup(null);
      router.refresh();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo guardar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(groupId: string) {
    if (!confirm("¿Eliminar este grupo? Los alumnos no se borran.")) return;
    setDeletingId(groupId);
    try {
      await deleteTeacherStudentGroupAction(groupId);
      toast({ title: "Grupo eliminado" });
      router.refresh();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo eliminar",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13px] text-muted-foreground">
          Creá grupos con varios alumnos para agregarlos de una al crear una clase compartida.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 shrink-0 rounded px-3 text-[13px] font-medium"
          onClick={openCreate}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Nuevo grupo
        </Button>
      </div>

      {initialGroups.length === 0 ? (
        <p className="rounded-md border border-border/80 bg-muted/20 px-3 py-4 text-[13px] text-muted-foreground">
          Todavía no tenés grupos. Creá uno y elegí qué alumnos incluye.
        </p>
      ) : (
        <ul className="divide-y divide-border/80 rounded-md border border-border/80">
          {initialGroups.map((g) => (
            <li
              key={g.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-[13px]"
            >
              <div>
                <p className="font-medium">{g.name}</p>
                <p className="text-[12px] text-muted-foreground">
                  {g.student_ids.length === 0
                    ? "Sin alumnos"
                    : `${g.student_ids.length} alumno${g.student_ids.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-[12px]"
                  onClick={() => openEdit(g)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1 text-[12px] text-destructive hover:text-destructive"
                  disabled={deletingId === g.id}
                  onClick={() => void handleDelete(g.id)}
                >
                  {deletingId === g.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o);
          if (!o) setEditingGroup(null);
        }}
      >
        <DialogContent className="sm:max-w-md" aria-describedby="group-editor-desc">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "Editar grupo" : "Nuevo grupo"}</DialogTitle>
            <DialogDescription id="group-editor-desc">
              Elegí un nombre y los alumnos que forman parte del grupo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="group-name" className="text-[13px] font-medium">
                Nombre del grupo
              </label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Pilates mañana"
                className="h-9"
              />
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar alumno..."
                className="h-9 pl-9"
                aria-label="Buscar alumno"
              />
            </div>
            <div className="max-h-[220px] space-y-2 overflow-y-auto rounded-md border border-border/80 p-2">
              {students.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-muted-foreground">
                  No tenés alumnos cargados.
                </p>
              ) : filteredStudents.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-muted-foreground">
                  Sin resultados.
                </p>
              ) : (
                filteredStudents.map((s) => (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 text-[13px] hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedIds.has(s.id)}
                      onCheckedChange={() => toggleStudent(s.id)}
                      aria-label={s.full_name}
                    />
                    <span className="capitalize">{s.full_name}</span>
                  </label>
                ))
              )}
            </div>
            <p className="text-[12px] text-muted-foreground">
              Seleccionados: {selectedIds.size}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="button" variant="secondary" onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : editingGroup ? (
                "Guardar"
              ) : (
                "Crear grupo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

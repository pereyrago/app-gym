import type { TablesInsert, TablesUpdate } from "@/types/database.types";
import { classCanBeEdited } from "@/lib/class-utils";
import * as classesRepo from "@/repositories/classes";

export async function createClass(input: TablesInsert<"classes">) {
  return classesRepo.createClass(input);
}

export async function updateClass(id: string, input: TablesUpdate<"classes">) {
  const existing = await classesRepo.getClassById(id);
  if (!existing) throw new Error("Clase no encontrada");
  const row = existing as { class_date: string; start_time?: string };
  if (!classCanBeEdited(row.class_date, String(row.start_time ?? "09:00").slice(0, 5))) {
    throw new Error("No se puede editar la clase después de 24 horas del inicio");
  }
  return classesRepo.updateClass(id, input);
}

export async function deleteClass(id: string) {
  const existing = await classesRepo.getClassById(id);
  if (!existing) throw new Error("Clase no encontrada");
  const row = existing as { class_date: string; start_time?: string };
  if (!classCanBeEdited(row.class_date, String(row.start_time ?? "09:00").slice(0, 5))) {
    throw new Error("No se puede eliminar la clase después de 24 horas del inicio");
  }
  return classesRepo.deleteClass(id);
}

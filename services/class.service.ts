import type { TablesInsert, TablesUpdate } from "@/types/database.types";
import * as classesRepo from "@/repositories/classes";

export async function createClass(input: TablesInsert<"classes">) {
  return classesRepo.createClass(input);
}

export async function updateClass(id: string, input: TablesUpdate<"classes">) {
  const existing = await classesRepo.getClassById(id);
  if (!existing) throw new Error("Clase no encontrada");
  return classesRepo.updateClass(id, input);
}

export async function deleteClass(id: string) {
  const existing = await classesRepo.getClassById(id);
  if (!existing) throw new Error("Clase no encontrada");
  return classesRepo.deleteClass(id);
}

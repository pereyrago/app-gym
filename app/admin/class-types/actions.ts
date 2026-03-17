"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClassType, deleteClassType } from "@/repositories/class-types";
import { createClassTypeSchema } from "@/validations/class-type";

export async function createClassTypeAction(input: unknown) {
  await requireAdmin();
  const parsed = createClassTypeSchema.parse(input);
  await createClassType({ name: parsed.name });
  revalidatePath("/admin/class-types");
}

export async function deleteClassTypeAction(id: string) {
  await requireAdmin();
  await deleteClassType(id);
  revalidatePath("/admin/class-types");
}

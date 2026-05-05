"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createPeriodSchema, updatePeriodSchema } from "@/validations/period";

export async function createPeriodAction(input: unknown) {
  await requireAdmin();
  const parsed = createPeriodSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from("periods").insert({
    name: parsed.name,
    start_date: parsed.start_date,
    end_date: parsed.end_date,
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/periods");
}

export async function updatePeriodAction(id: string, input: unknown) {
  await requireAdmin();
  const parsed = updatePeriodSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from("periods")
    .update({
      name: parsed.name,
      start_date: parsed.start_date,
      end_date: parsed.end_date,
    } as never)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/periods");
}

export async function deletePeriodAction(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("periods").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error(
        "No se puede eliminar el período porque tiene clases asociadas. Primero debés eliminar o reasignar las clases."
      );
    }
    throw new Error(error.message);
  }
  revalidatePath("/admin/periods");
}

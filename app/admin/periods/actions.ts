"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createPeriodSchema } from "@/validations/period";

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

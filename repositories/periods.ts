import { createClient } from "@/lib/supabase/server";
import type { Period } from "@/types";

export async function getPeriods(): Promise<Period[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("periods")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getPeriodById(periodId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("periods").select("*").eq("id", periodId).single();

  if (error) throw error;
  return data as Period;
}

/** Período actual: aquel cuya fecha de hoy está entre start_date y end_date. */
export async function getCurrentPeriod(): Promise<Period | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("periods")
    .select("*")
    .lte("start_date", today)
    .gte("end_date", today)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Period | null;
}

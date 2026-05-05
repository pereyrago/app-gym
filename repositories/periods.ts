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

/** Busca el período que corresponde a una fecha específica. */
export async function getPeriodForDate(date: string): Promise<Period | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("periods")
    .select("*")
    .lte("start_date", date)
    .gte("end_date", date)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as Period | null;
}

/** Período actual: aquel cuya fecha de hoy está entre start_date y end_date. */
export async function getCurrentPeriod(): Promise<Period | null> {
  const today = new Date().toISOString().slice(0, 10);
  return getPeriodForDate(today);
}

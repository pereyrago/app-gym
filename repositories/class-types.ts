import { createClient } from "@/lib/supabase/server";
import type { ClassType } from "@/types";
import type { TablesInsert, TablesUpdate } from "@/types/database.types";

export async function getClassTypes(): Promise<ClassType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_types")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ClassType[];
}

export async function createClassType(input: TablesInsert<"class_types">) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_types")
    .insert(input as never)
    .select()
    .single();
  if (error) throw error;
  return data as ClassType;
}

export async function updateClassType(id: string, input: TablesUpdate<"class_types">) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("class_types")
    .update(input as never)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ClassType;
}

export async function deleteClassType(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("class_types").delete().eq("id", id);
  if (error) throw error;
}

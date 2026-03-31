"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createTeacher } from "@/services/teacher.service";
import { getSupabaseAuthAdminClient } from "@/lib/supabase/admin";
import { softDeleteStudent } from "@/repositories/students";

export async function createTeacherAction(formData: FormData) {
  await requireAdmin();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = formData.get("full_name") as string;
  const dni = (formData.get("dni") as string)?.trim() || undefined;
  const phone = (formData.get("phone") as string)?.trim() || undefined;
  await createTeacher({ email, password, full_name, dni, phone });
  revalidatePath("/admin/teachers");
}

export async function deleteTeacherAction(teacherId: string) {
  await requireAdmin();
  const supabase = getSupabaseAuthAdminClient();
  const { data: teacher } = await supabase
    .from("teachers")
    .select("profile_id")
    .eq("id", teacherId)
    .single();
  if (!teacher || !("profile_id" in teacher)) throw new Error("Profesor no encontrado");
  await supabase.auth.admin.deleteUser(teacher.profile_id as string);
  revalidatePath("/admin/teachers");
}

export async function deleteStudentAction(studentId: string) {
  await requireAdmin();
  await softDeleteStudent(studentId);
  revalidatePath("/admin/students");
}

export async function resetTeacherPasswordAction(profileId: string, newPassword: string) {
  await requireAdmin();
  const trimmed = newPassword.trim();
  if (trimmed.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
  const supabase = getSupabaseAuthAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(profileId, { password: trimmed });
  if (error) throw error;
  revalidatePath("/admin/teachers");
}

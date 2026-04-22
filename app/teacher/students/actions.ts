"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getMyTeacherId } from "@/lib/teacher";
import {
  createStudent,
  getStudentsByTeacher,
  getStudentsByTeacherCacheTag,
  updateStudent,
  updateStudentStatus,
  deleteStudent,
} from "@/repositories/students";
import type { Student } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { createStudentSchema, updateStudentSchema } from "@/validations/student";

export async function getMyStudentsAction(): Promise<Student[]> {
  const teacherId = await getMyTeacherId();
  if (!teacherId) return [];
  return getStudentsByTeacher(teacherId);
}

function revalidateStudentsCache(teacherId: string) {
  revalidateTag(getStudentsByTeacherCacheTag(teacherId));
}

export async function confirmStudentAction(studentId: string, classId?: string) {
  const teacherId = await getMyTeacherId();
  if (!teacherId) throw new Error("No autorizado");
  const students = await getStudentsByTeacher(teacherId);
  if (!students.some((s) => s.id === studentId)) throw new Error("Alumno no encontrado");
  await updateStudentStatus(studentId, "active");
  revalidateStudentsCache(teacherId);
  revalidatePath("/teacher/students");
  revalidatePath("/teacher");
  if (classId) revalidatePath(`/teacher/classes/${classId}`);
}

export async function updateStudentAction(studentId: string, input: unknown) {
  const teacherId = await getMyTeacherId();
  if (!teacherId) throw new Error("No autorizado");

  const parsed = updateStudentSchema.parse(input);
  const supabase = await createClient();

  const { data: allowed } = await supabase.rpc("teacher_can_use_student", {
    p_teacher_id: teacherId,
    p_student_id: studentId,
  });
  if (!allowed) throw new Error("No tienes permiso para editar este alumno");

  const dniTrim = parsed.dni?.trim();
  const dniForDb = dniTrim === "" ? null : dniTrim;

  await updateStudent(studentId, {
    full_name: parsed.full_name?.trim(),
    dni: dniForDb,
    email: parsed.email?.trim() || null,
    phone: parsed.phone?.trim(),
    emergency_contact_phone: parsed.emergency_contact_phone?.trim() || null,
    apto_fisico: parsed.apto_fisico ?? null,
  });

  revalidateStudentsCache(teacherId);
  revalidatePath("/teacher/students");
  revalidatePath(`/teacher/students/${studentId}`);
}

export async function deleteStudentAction(studentId: string) {
  const teacherId = await getMyTeacherId();
  if (!teacherId) throw new Error("No autorizado");

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("teacher_id")
    .eq("id", studentId)
    .single();

  if (!student || student.teacher_id !== teacherId) {
    throw new Error("Solo el profesor titular puede eliminar al alumno");
  }

  await deleteStudent(studentId);

  revalidateStudentsCache(teacherId);
  revalidatePath("/teacher/students");
  revalidatePath("/teacher");
}

export async function rejectStudentAction(studentId: string, classId?: string) {
  const teacherId = await getMyTeacherId();
  if (!teacherId) throw new Error("No autorizado");
  if (!classId) throw new Error("Falta classId para rechazar al alumno en esta clase.");
  const students = await getStudentsByTeacher(teacherId);
  const student = students.find((s) => s.id === studentId);
  if (!student) throw new Error("Alumno no encontrado");
  const supabase = await createClient();
  const attendanceDelete = supabase
    .from("class_attendances")
    .delete()
    .eq("student_id", studentId)
    .eq("class_id", classId);
  const { error: attErr } = await attendanceDelete;
  if (attErr) throw attErr;

  if (student.teacher_id === teacherId) {
    await updateStudentStatus(studentId, "rejected");
  }
  revalidateStudentsCache(teacherId);
  revalidatePath("/teacher/students");
  revalidatePath("/teacher");
  if (classId) revalidatePath(`/teacher/classes/${classId}`);
}

export async function createStudentAction(input: unknown) {
  const teacherId = await getMyTeacherId();
  if (!teacherId) throw new Error("No autorizado");
  const parsed = createStudentSchema.parse(input);
  const supabase = await createClient();
  const dniTrim = parsed.dni.trim();
  const dniForDb = dniTrim === "" ? null : dniTrim;
  if (dniForDb) {
    const { data: existing } = await supabase
      .from("students")
      .select("id")
      .eq("teacher_id", teacherId)
      .eq("dni", dniForDb)
      .is("deleted_at", null)
      .maybeSingle();
    if (existing) throw new Error("Ese DNI ya está registrado para un alumno");
  }
  await createStudent({
    teacher_id: teacherId,
    full_name: parsed.full_name.trim(),
    dni: dniForDb,
    email: parsed.email?.trim() || null,
    phone: parsed.phone.trim(),
    emergency_contact_phone: parsed.emergency_contact_phone?.trim() || null,
    apto_fisico: parsed.apto_fisico ?? null,
  });
  revalidateStudentsCache(teacherId);
  revalidatePath("/teacher/students");
  revalidatePath("/teacher");
}

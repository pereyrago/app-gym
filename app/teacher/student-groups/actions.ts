"use server";

import { revalidatePath } from "next/cache";
import { getMyTeacherId } from "@/lib/teacher";
import { getStudentsByTeacher } from "@/repositories/students";
import {
  createTeacherStudentGroup,
  deleteTeacherStudentGroup,
  listTeacherStudentGroups,
  updateTeacherStudentGroup,
  type TeacherStudentGroupWithStudents,
} from "@/repositories/teacher-student-groups";
import {
  teacherStudentGroupSchema,
  teacherStudentGroupUpdateSchema,
} from "@/validations/teacher-student-group";

async function assertStudentIdsForTeacher(teacherId: string, studentIds: string[]) {
  if (studentIds.length === 0) return;
  const students = await getStudentsByTeacher(teacherId);
  const allowed = new Set(students.map((s) => s.id));
  for (const id of studentIds) {
    if (!allowed.has(id)) throw new Error("Uno o más alumnos no pertenecen a tu lista");
  }
}

export async function getTeacherStudentGroupsAction(): Promise<TeacherStudentGroupWithStudents[]> {
  const teacherId = await getMyTeacherId();
  if (!teacherId) return [];
  return listTeacherStudentGroups(teacherId);
}

export async function createTeacherStudentGroupAction(input: unknown): Promise<{ id: string }> {
  const teacherId = await getMyTeacherId();
  if (!teacherId) throw new Error("No autorizado");
  const parsed = teacherStudentGroupSchema.parse(input);
  await assertStudentIdsForTeacher(teacherId, parsed.student_ids);
  const id = await createTeacherStudentGroup(teacherId, parsed.name, parsed.student_ids);
  revalidatePath("/teacher/student-groups");
  revalidatePath("/teacher");
  return { id };
}

export async function updateTeacherStudentGroupAction(input: unknown): Promise<void> {
  const teacherId = await getMyTeacherId();
  if (!teacherId) throw new Error("No autorizado");
  const parsed = teacherStudentGroupUpdateSchema.parse(input);
  await assertStudentIdsForTeacher(teacherId, parsed.student_ids);
  await updateTeacherStudentGroup(parsed.id, teacherId, parsed.name, parsed.student_ids);
  revalidatePath("/teacher/student-groups");
  revalidatePath("/teacher");
}

export async function deleteTeacherStudentGroupAction(groupId: string): Promise<void> {
  const teacherId = await getMyTeacherId();
  if (!teacherId) throw new Error("No autorizado");
  await deleteTeacherStudentGroup(groupId, teacherId);
  revalidatePath("/teacher/student-groups");
  revalidatePath("/teacher");
}

"use server";

import { revalidatePath } from "next/cache";
import { getMyTeacherId } from "@/lib/teacher";
import { getCurrentPeriod } from "@/repositories/periods";
import { createClass } from "@/services/class.service";
import { setClassAttendances } from "@/repositories/attendances";
import type { ClassScope } from "@/types/database.types";

export async function createClassAction(input: {
  class_type_id: string;
  class_dates: string[];
  start_time: string;
  duration_minutes: number;
  teacher_id: string;
  /** Si se envían más de uno, la clase se crea como compartida. */
  student_ids?: string[];
}): Promise<{ ids: string[] }> {
  const myTeacherId = await getMyTeacherId();
  if (!myTeacherId || myTeacherId !== input.teacher_id) {
    throw new Error("No autorizado");
  }
  const currentPeriod = await getCurrentPeriod();
  if (!currentPeriod) {
    throw new Error("No hay período activo. El administrador debe crear un período vigente.");
  }
  if (input.class_dates.length === 0) {
    throw new Error("Debe seleccionar al menos una fecha.");
  }

  const studentIds = input.student_ids ?? [];
  const scope: ClassScope = studentIds.length > 1 ? "shared" : "individual";
  const createdIds: string[] = [];

  for (const date of input.class_dates) {
    const created = await createClass({
      teacher_id: input.teacher_id,
      period_id: currentPeriod.id,
      class_type_id: input.class_type_id,
      class_date: date,
      start_time: input.start_time,
      duration_minutes: input.duration_minutes,
      status: "success",
      scope,
    });
    const classId = (created as { id: string }).id;
    if (studentIds.length > 0) {
      await setClassAttendances(classId, studentIds);
    }
    createdIds.push(classId);
  }

  revalidatePath("/teacher/classes");
  revalidatePath("/teacher");
  return { ids: createdIds };
}

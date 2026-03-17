"use server";

import { revalidatePath } from "next/cache";
import { getMyTeacherId } from "@/lib/teacher";
import { getClassById } from "@/repositories/classes";
import {
  setClassAttendances,
  setClassAbsences,
  clearClassAbsences,
} from "@/repositories/attendances";
import { nowInAppTz, parseClassDateTimeInAppTz } from "@/lib/app-timezone";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export async function setAttendancesAction(classId: string, studentIds: string[]) {
  const teacherId = await getMyTeacherId();
  if (!teacherId) throw new Error("No autorizado");

  const classRow = await getClassById(classId);
  const row = classRow as {
    teacher_id: string;
    class_date: string;
    start_time?: string;
  } | null;
  if (!row || row.teacher_id !== teacherId) {
    throw new Error("No autorizado");
  }

  const now = nowInAppTz().getTime();
  const classStart = parseClassDateTimeInAppTz(
    row.class_date,
    String(row.start_time ?? "09:00").slice(0, 5)
  ).getTime();
  if (now > classStart + TWENTY_FOUR_HOURS_MS) {
    throw new Error("Esta clase ya no puede editarse (pasaron más de 24 horas desde el inicio).");
  }

  await setClassAttendances(classId, studentIds);
  if (studentIds.length > 0) {
    await updateClassStatusToSuccess(classId, teacherId);
  }
  revalidatePath(`/teacher/classes/${classId}`);
  revalidatePath("/teacher/classes");
  revalidatePath("/teacher");
}

export type AbsencePayload = {
  student_id: string;
  reason_type: string;
  reason_other?: string | null;
  observations?: string | null;
};

/** Guarda asistencias y registra faltas con motivo para los alumnos que se sacaron. */
export async function setAttendancesWithAbsencesAction(
  classId: string,
  attendedIds: string[],
  absences: AbsencePayload[]
) {
  const teacherId = await getMyTeacherId();
  if (!teacherId) throw new Error("No autorizado");

  const classRow = await getClassById(classId);
  const row = classRow as {
    teacher_id: string;
    class_date: string;
    start_time?: string;
  } | null;
  if (!row || row.teacher_id !== teacherId) throw new Error("No autorizado");

  const now = nowInAppTz().getTime();
  const classStart = parseClassDateTimeInAppTz(
    row.class_date,
    String(row.start_time ?? "09:00").slice(0, 5)
  ).getTime();
  if (now > classStart + TWENTY_FOUR_HOURS_MS) {
    throw new Error("Esta clase ya no puede editarse (pasaron más de 24 horas desde el inicio).");
  }

  await setClassAttendances(classId, attendedIds);
  await setClassAbsences(classId, attendedIds, absences);
  if (attendedIds.length > 0) {
    await updateClassStatusToSuccess(classId, teacherId);
  } else {
    await setClassStatusToCancelByStudent(classId, teacherId);
  }
  revalidatePath(`/teacher/classes/${classId}`);
  revalidatePath("/teacher/classes");
  revalidatePath("/teacher");
}

/** Marca la clase como realizada cuando hay al menos un asistente. */
async function updateClassStatusToSuccess(classId: string, teacherId: string) {
  const classRow = await getClassById(classId);
  const row = classRow as { teacher_id: string } | null;
  if (!row || row.teacher_id !== teacherId) return;
  const { updateClass } = await import("@/services/class.service");
  await updateClass(classId, {
    status: "success",
    cancellation_reason: null,
    cancellation_reason_type: null,
    cancellation_reason_other: null,
    cancellation_reason_observations: null,
  });
}

/** Marca la clase como cancelada por alumno cuando no tiene asistentes. */
async function setClassStatusToCancelByStudent(classId: string, teacherId: string) {
  const classRow = await getClassById(classId);
  const row = classRow as { teacher_id: string } | null;
  if (!row || row.teacher_id !== teacherId) return;
  const { updateClass } = await import("@/services/class.service");
  await updateClass(classId, {
    status: "cancel_by_student",
    cancellation_reason: "Sin asistentes (todos cancelaron)",
    cancellation_reason_type: "otro",
    cancellation_reason_other: "Sin asistentes (todos cancelaron)",
    cancellation_reason_observations: null,
  });
}

const CANCELLATION_REASON_LABELS: Record<string, string> = {
  viaje: "Viaje",
  enfermedad: "Enfermedad",
  trabajo: "Trabajo",
  sin_aviso: "Sin aviso",
  otro: "Otro",
};

function buildCancellationReasonDisplay(p: {
  reason_type: string;
  reason_other: string | null;
  observations: string | null;
}): string {
  const parts: string[] = [];
  if (p.reason_type === "otro" && p.reason_other?.trim()) {
    parts.push(`Otro: ${p.reason_other.trim()}`);
  } else if (p.reason_type && CANCELLATION_REASON_LABELS[p.reason_type]) {
    parts.push(CANCELLATION_REASON_LABELS[p.reason_type]);
  }
  if (p.observations?.trim()) parts.push(`Obs: ${p.observations.trim()}`);
  return parts.join(". ") || "Cancelada";
}

export async function updateClassStatusAction(
  classId: string,
  input: {
    status: "success" | "cancel_by_student" | "cancel_by_teacher";
    cancellation_reason_type?: string | null;
    cancellation_reason_other?: string | null;
    cancellation_reason_observations?: string | null;
  }
) {
  const teacherId = await getMyTeacherId();
  if (!teacherId) throw new Error("No autorizado");

  const classRow = await getClassById(classId);
  const row = classRow as { teacher_id: string } | null;
  if (!row || row.teacher_id !== teacherId) throw new Error("No autorizado");

  const {
    status,
    cancellation_reason_type,
    cancellation_reason_other,
    cancellation_reason_observations,
  } = input;
  if (status !== "success") {
    const validTypes = ["viaje", "enfermedad", "trabajo", "sin_aviso", "otro"];
    if (!cancellation_reason_type || !validTypes.includes(cancellation_reason_type)) {
      throw new Error("Seleccioná un motivo de cancelación.");
    }
    if (cancellation_reason_type === "otro" && !String(cancellation_reason_other ?? "").trim()) {
      throw new Error("Escribí el motivo en el campo Otro.");
    }
  }

  const cancellation_reason =
    status === "success"
      ? null
      : buildCancellationReasonDisplay({
          reason_type: cancellation_reason_type ?? "",
          reason_other: cancellation_reason_other ?? null,
          observations: cancellation_reason_observations ?? null,
        });

  const { updateClass } = await import("@/services/class.service");
  await updateClass(classId, {
    status,
    cancellation_reason,
    cancellation_reason_type: status === "success" ? null : (cancellation_reason_type ?? null),
    cancellation_reason_other: status === "success" ? null : (cancellation_reason_other ?? null),
    cancellation_reason_observations:
      status === "success" ? null : (cancellation_reason_observations ?? null),
  });
  revalidatePath(`/teacher/classes/${classId}`);
  revalidatePath("/teacher/classes");
  revalidatePath("/teacher");
}

/** Cancela la clase por el profesor: motivo obligatorio, se vacían asistencias y no se registran faltas a los alumnos. */
export async function cancelClassByTeacherAction(
  classId: string,
  input: {
    cancellation_reason_type: string;
    cancellation_reason_other?: string | null;
    cancellation_reason_observations?: string | null;
  }
) {
  const teacherId = await getMyTeacherId();
  if (!teacherId) throw new Error("No autorizado");

  const classRow = await getClassById(classId);
  const row = classRow as {
    teacher_id: string;
    class_date: string;
    start_time?: string;
  } | null;
  if (!row || row.teacher_id !== teacherId) throw new Error("No autorizado");

  const now = nowInAppTz().getTime();
  const classStart = parseClassDateTimeInAppTz(
    row.class_date,
    String(row.start_time ?? "09:00").slice(0, 5)
  ).getTime();
  if (now > classStart + TWENTY_FOUR_HOURS_MS) {
    throw new Error("Esta clase ya no puede editarse (pasaron más de 24 horas desde el inicio).");
  }

  await updateClassStatusAction(classId, {
    status: "cancel_by_teacher",
    cancellation_reason_type: input.cancellation_reason_type,
    cancellation_reason_other: input.cancellation_reason_other ?? null,
    cancellation_reason_observations: input.cancellation_reason_observations ?? null,
  });
  await setClassAttendances(classId, []);
  await clearClassAbsences(classId);
  revalidatePath(`/teacher/classes/${classId}`);
  revalidatePath("/teacher/classes");
  revalidatePath("/teacher");
}

import { getMyTeacherId, getMyTeacherSlug } from "@/lib/teacher";
import { getPeriods, getCurrentPeriod } from "@/repositories/periods";
import {
  getClassesByTeacherAndPeriod,
  getStudentPeriodClassesWithAttendance,
} from "@/repositories/classes";
import { getClassTypes } from "@/repositories/class-types";
import { getStudentsByTeacher } from "@/repositories/students";
import { TeacherClassesList } from "@/features/teacher/teacher-classes-list";
import { CreateClassDialog } from "@/features/teacher/create-class-dialog";
import { TeacherQRCard } from "@/features/teacher/teacher-qr-card";

export default async function TeacherClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ periodId?: string; studentId?: string }>;
}) {
  const teacherId = await getMyTeacherId();
  const { periodId, studentId } = await searchParams;

  if (!teacherId) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        No se encontró tu perfil de profesor.
      </div>
    );
  }

  const [periods, currentPeriod, classTypesResult, publicSlug, students] = await Promise.all([
    getPeriods(),
    getCurrentPeriod(),
    getClassTypes().catch(() => [] as Awaited<ReturnType<typeof getClassTypes>>),
    getMyTeacherSlug(),
    getStudentsByTeacher(teacherId).catch(
      () => [] as Awaited<ReturnType<typeof getStudentsByTeacher>>
    ),
  ]);
  const classTypes = Array.isArray(classTypesResult) ? classTypesResult : [];
  const selectedPeriodId = periodId ?? currentPeriod?.id ?? periods[0]?.id ?? null;
  const selectedStudentId = studentId ?? null;
  let classes: Awaited<ReturnType<typeof getClassesByTeacherAndPeriod>> = [];
  if (selectedPeriodId) {
    try {
      classes = selectedStudentId
        ? (await getStudentPeriodClassesWithAttendance(selectedStudentId, selectedPeriodId)).map(
            (row) => row.class
          )
        : await getClassesByTeacherAndPeriod(teacherId, selectedPeriodId);
    } catch (e) {
      console.error("[teacher/classes] Error loading classes:", e);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con título, compartir link y botón de crear clase */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Clases</h1>
        <div className="flex items-center gap-3">
          {publicSlug && <TeacherQRCard slug={publicSlug} />}
          <CreateClassDialog
            teacherId={teacherId}
            currentPeriod={currentPeriod}
            classTypes={classTypes}
          />
        </div>
      </div>

      {/* Listado y filtros de clases */}
      <TeacherClassesList
        teacherId={teacherId}
        periods={periods}
        selectedPeriodId={selectedPeriodId}
        students={students}
        selectedStudentId={selectedStudentId}
        classes={classes}
      />
    </div>
  );
}

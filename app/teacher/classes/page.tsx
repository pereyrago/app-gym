import Link from "next/link";
import { getMyTeacherId } from "@/lib/teacher";
import { getPeriods, getCurrentPeriod } from "@/repositories/periods";
import {
  getClassesByTeacherAndPeriod,
  getStudentPeriodClassesWithAttendance,
} from "@/repositories/classes";
import { getClassTypes } from "@/repositories/class-types";
import { getStudentsByTeacher } from "@/repositories/students";
import { TeacherClassesList } from "@/features/teacher/teacher-classes-list";
import { CreateClassDialog } from "@/features/teacher/create-class-dialog";
import { ChevronLeft } from "lucide-react";

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

  const [periods, currentPeriod, classTypesResult, students] = await Promise.all([
    getPeriods(),
    getCurrentPeriod(),
    getClassTypes().catch(() => [] as Awaited<ReturnType<typeof getClassTypes>>),
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Breadcrumb">
          <Link
            href="/teacher"
            className="inline-flex items-center text-[13px] text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Profesor
          </Link>
        </nav>
        <h1 className="text-lg font-semibold tracking-tight">Clases</h1>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <TeacherClassesList
          teacherId={teacherId}
          periods={periods}
          selectedPeriodId={selectedPeriodId}
          students={students}
          selectedStudentId={selectedStudentId}
          classes={classes}
        />
        <CreateClassDialog
          teacherId={teacherId}
          currentPeriod={currentPeriod}
          classTypes={classTypes}
        />
      </div>
    </div>
  );
}

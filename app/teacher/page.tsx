import Link from "next/link";
import { getMyTeacherId, getMyTeacherSlug, getMyTeacherName } from "@/lib/teacher";
import { getPeriods, getCurrentPeriod } from "@/repositories/periods";
import {
  getClassesByTeacherAndPeriod,
  getStudentPeriodClassesWithAttendance,
} from "@/repositories/classes";
import { getClassTypes } from "@/repositories/class-types";
import { getStudentsByTeacher } from "@/repositories/students";
import { TeacherClassesList } from "@/features/teacher/teacher-classes-list";
import { CreateStudentDialog } from "@/features/teacher/create-student-dialog";
import { CreateClassDialog } from "@/features/teacher/create-class-dialog";
import { TeacherQRCard } from "@/features/teacher/teacher-qr-card";
import { Button } from "@/components/ui/button";
import { Users, UsersRound } from "lucide-react";

export default async function TeacherDashboardPage({
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

  const [periods, currentPeriod, classTypesResult, publicSlug, teacherName, students] =
    await Promise.all([
      getPeriods(),
      getCurrentPeriod(),
      getClassTypes().catch(() => [] as Awaited<ReturnType<typeof getClassTypes>>),
      getMyTeacherSlug(),
      getMyTeacherName(),
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
      console.error("[teacher] Error loading classes:", e);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-nowrap items-center justify-between gap-3">
        <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight">
          Hola, {teacherName?.trim() || "profesor"}
        </h1>
        {publicSlug && <TeacherQRCard slug={publicSlug} />}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CreateStudentDialog />
        <CreateClassDialog
          teacherId={teacherId}
          currentPeriod={currentPeriod}
          classTypes={classTypes}
        />
        <Button
          variant="tertiary"
          size="sm"
          className="h-8 rounded px-3 text-[13px] font-medium"
          asChild
        >
          <Link href="/teacher/students">
            <Users className="mr-2 h-3.5 w-3.5" />
            Alumnos
          </Link>
        </Button>
        <Button
          variant="tertiary"
          size="sm"
          className="h-8 rounded px-3 text-[13px] font-medium"
          asChild
        >
          <Link href="/teacher/student-groups">
            <UsersRound className="mr-2 h-3.5 w-3.5" />
            Grupos
          </Link>
        </Button>
      </div>

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

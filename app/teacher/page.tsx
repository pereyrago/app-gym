import Link from "next/link";
import { getMyTeacherId, getMyTeacherSlug, getMyTeacherName } from "@/lib/teacher";
import { getPeriods, getCurrentPeriod } from "@/repositories/periods";
import { getClassesByTeacherAndPeriod } from "@/repositories/classes";
import { getClassTypes } from "@/repositories/class-types";
import { TeacherClassesList } from "@/features/teacher/teacher-classes-list";
import { CreateStudentDialog } from "@/features/teacher/create-student-dialog";
import { CreateClassDialog } from "@/features/teacher/create-class-dialog";
import { TeacherQRCard } from "@/features/teacher/teacher-qr-card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export default async function TeacherDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodId?: string }>;
}) {
  const teacherId = await getMyTeacherId();
  const { periodId } = await searchParams;

  if (!teacherId) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        No se encontró tu perfil de profesor.
      </div>
    );
  }

  const [periods, currentPeriod, classTypesResult, publicSlug, teacherName] = await Promise.all([
    getPeriods(),
    getCurrentPeriod(),
    getClassTypes().catch(() => [] as Awaited<ReturnType<typeof getClassTypes>>),
    getMyTeacherSlug(),
    getMyTeacherName(),
  ]);
  const classTypes = Array.isArray(classTypesResult) ? classTypesResult : [];
  const selectedPeriodId = periodId ?? currentPeriod?.id ?? periods[0]?.id ?? null;
  let classes: Awaited<ReturnType<typeof getClassesByTeacherAndPeriod>> = [];
  if (selectedPeriodId) {
    try {
      classes = await getClassesByTeacherAndPeriod(teacherId, selectedPeriodId);
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
      </div>

      <TeacherClassesList
        teacherId={teacherId}
        periods={periods}
        selectedPeriodId={selectedPeriodId}
        classes={classes}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { getClassWithAttendances } from "@/repositories/classes";
import { getAbsencesByClassId } from "@/repositories/attendances";
import { getStudentsByTeacher } from "@/repositories/students";
import { getMyTeacherId } from "@/lib/teacher";
import { TeacherClassDetailCard } from "@/features/teacher/teacher-class-detail-card";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ classId: string }>;
}

export default async function TeacherClassDetailPage({ params }: PageProps) {
  const { classId } = await params;
  const teacherId = await getMyTeacherId();
  if (!teacherId) notFound();

  const [classData, students, absenceDetails] = await Promise.all([
    getClassWithAttendances(classId),
    getStudentsByTeacher(teacherId),
    getAbsencesByClassId(classId),
  ]);

  if (!classData || classData.teacher_id !== teacherId) notFound();

  const attendedIds = new Set((classData.class_attendances ?? []).map((a) => a.student_id));
  const initialAbsentIds = absenceDetails.map((a) => a.student_id);
  const displayStatus = attendedIds.size > 0 ? "success" : (classData.status ?? "success");

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/teacher" className="text-muted-foreground hover:text-foreground">
          Profesor
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href="/teacher/classes" className="text-muted-foreground hover:text-foreground">
          Clases
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{classData.class_types?.name ?? "Clase"}</span>
      </nav>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/teacher/classes">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver a clases
        </Link>
      </Button>
      <TeacherClassDetailCard
        classId={classId}
        classTypeName={classData.class_types?.name ?? "Clase"}
        classDate={classData.class_date}
        startTime={classData.start_time ?? null}
        durationMinutes={classData.duration_minutes ?? 60}
        status={displayStatus}
        cancellationReason={classData.cancellation_reason ?? null}
        cancellationReasonType={classData.cancellation_reason_type ?? null}
        cancellationReasonOther={classData.cancellation_reason_other ?? null}
        cancellationReasonObservations={classData.cancellation_reason_observations ?? null}
        scope={classData.scope ?? "individual"}
        canEdit
        students={students}
        initialAttendedIds={Array.from(attendedIds)}
        initialAbsentIds={initialAbsentIds}
        absenceDetails={absenceDetails}
      />
    </div>
  );
}

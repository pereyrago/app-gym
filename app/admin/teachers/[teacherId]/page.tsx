import { notFound } from "next/navigation";
import Link from "next/link";
import { getTeacherById } from "@/repositories/teachers";
import { getPeriods } from "@/repositories/periods";
import { getClassesByTeacherAndPeriod } from "@/repositories/classes";
import { TeacherClassesView } from "@/features/admin/teacher-classes-view";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ teacherId: string }>;
  searchParams: Promise<{ periodId?: string }>;
}

export default async function AdminTeacherDetailPage({ params, searchParams }: PageProps) {
  const { teacherId } = await params;
  const { periodId } = await searchParams;

  const [teacher, periods] = await Promise.all([getTeacherById(teacherId), getPeriods()]);

  if (!teacher) notFound();

  const selectedPeriodId = periodId ?? periods[0]?.id;
  const classes = selectedPeriodId
    ? await getClassesByTeacherAndPeriod(teacherId, selectedPeriodId)
    : [];

  const profile = (
    teacher as unknown as {
      profiles: { email: string; full_name: string | null; role: string } | null;
    }
  ).profiles;
  const teacherName = profile?.full_name ?? profile?.email ?? "Profesor";

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2">
        <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          Admin
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link
          href="/admin/teachers"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Profesores
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{teacherName}</span>
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/teachers">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Volver a profesores
          </Link>
        </Button>
        <h1 className="text-pretty text-lg font-semibold tracking-tight">
          Clases de {teacherName}
        </h1>
      </div>
      <TeacherClassesView
        teacherId={teacherId}
        teacherName={teacherName}
        periods={periods}
        selectedPeriodId={selectedPeriodId ?? null}
        classes={classes}
      />
    </div>
  );
}

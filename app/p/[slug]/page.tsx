import { notFound } from "next/navigation";
import { getPublicTeacherIdBySlug, getPublicClassesNext24h } from "./actions";
import { PublicAttendanceForm } from "./public-attendance-form";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicAttendancePage({ params }: Props) {
  const { slug } = await params;
  const teacherId = await getPublicTeacherIdBySlug(slug);
  if (!teacherId) notFound();

  const classes = await getPublicClassesNext24h(teacherId);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
      <h1 className="text-pretty text-lg font-semibold tracking-tight">Registrar asistencia</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Elegí la clase y tu nombre. Si no aparecés, te damos de alta para que el profesor confirme.
      </p>
      <PublicAttendanceForm slug={slug} classes={classes} />
    </div>
  );
}

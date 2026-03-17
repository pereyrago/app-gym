import { notFound } from "next/navigation";
import Link from "next/link";
import { getClassWithAttendances } from "@/repositories/classes";
import { getTeacherById } from "@/repositories/teachers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PageProps {
  params: Promise<{ teacherId: string; classId: string }>;
}

export default async function AdminClassAttendancesPage({ params }: PageProps) {
  const { teacherId, classId } = await params;

  const [classData, teacher] = await Promise.all([
    getClassWithAttendances(classId),
    getTeacherById(teacherId),
  ]);

  if (!classData || !teacher) notFound();

  const profile = (teacher as unknown as { profiles: { full_name: string | null } | null })
    .profiles;
  const teacherName = profile?.full_name ?? "Profesor";

  const attendances = (classData.class_attendances ?? []).slice().sort((a, b) => {
    const nameA = (a.students as { full_name?: string } | null)?.full_name ?? "";
    const nameB = (b.students as { full_name?: string } | null)?.full_name ?? "";
    return nameA.localeCompare(nameB, "es");
  });

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">
          Admin
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href="/admin/teachers" className="text-muted-foreground hover:text-foreground">
          Profesores
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link
          href={`/admin/teachers/${teacherId}`}
          className="text-muted-foreground hover:text-foreground"
        >
          {teacherName}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-medium">{classData.class_types?.name ?? "Clase"}</span>
      </nav>
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/teachers/${teacherId}`}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Volver a clases
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{classData.class_types?.name ?? "Clase"}</CardTitle>
          <CardContent className="pt-0 text-muted-foreground">
            {format(new Date(classData.class_date), "EEEE d MMMM", { locale: es })}
            {classData.start_time != null && (
              <>
                {" "}
                · {String(classData.start_time).slice(0, 5)} · {classData.duration_minutes} min
              </>
            )}
          </CardContent>
        </CardHeader>
        <CardContent>
          <h2 className="mb-2 text-sm font-medium">Alumnos asistentes</h2>
          {attendances.length === 0 ? (
            <p className="text-muted-foreground">Ningún alumno registrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((a) => {
                  const student = a.students as
                    | { full_name: string; email: string | null }
                    | undefined;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="capitalize">{student?.full_name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {student?.email ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

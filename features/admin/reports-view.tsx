"use client";

import { useCallback, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getReportDataForTeacher,
  getReportDataForAllTeachers,
  getReportDataForStudent,
} from "@/app/admin/reports/actions";
import {
  generateTeacherPdf,
  generateAllTeachersPdf,
  generateStudentAttendancePdf,
} from "@/lib/pdf";
import { buildReportPdfFilename, openPdfWithFilename } from "@/lib/pdf-download";
import { useToast } from "@/hooks/use-toast";
import type { TeacherWithProfile } from "@/types";
import type { Period } from "@/types";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportPdfButton, ReportPeriodField } from "@/features/admin/report-form-fields";

interface ReportsViewProps {
  teachers: TeacherWithProfile[];
  periods: Period[];
  students: Array<{ id: string; full_name: string }>;
}

function pdfErrorDescription(e: unknown): string {
  return e instanceof Error ? e.message : "No se pudo generar el PDF";
}

export function ReportsView({ teachers, periods, students }: ReportsViewProps) {
  const [teacherId, setTeacherId] = useState<string>("");
  const [periodId, setPeriodId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");
  const [loading, setLoading] = useState<"one" | "all" | "student" | null>(null);
  const [group2Multiplier, setGroup2Multiplier] = useState<number>(0.75);
  const [group3Multiplier, setGroup3Multiplier] = useState<number>(0.5);
  const { toast } = useToast();

  const selectedPeriodName = periods.find((p) => p.id === periodId)?.name ?? "";

  const toastPdfError = useCallback(
    (e: unknown) => {
      toast({
        title: "Error",
        description: pdfErrorDescription(e),
        variant: "destructive",
      });
    },
    [toast],
  );

  const handleTeacherPdf = useCallback(async () => {
    if (!teacherId || !periodId) {
      toast({
        title: "Selecciona profesor y período",
        variant: "destructive",
      });
      return;
    }
    setLoading("one");
    try {
      const data = await getReportDataForTeacher(teacherId, periodId);
      if (data) {
        const url = await generateTeacherPdf(data, {
          group2StudentMultiplier: group2Multiplier,
          group3StudentMultiplier: group3Multiplier,
        });
        const filename = buildReportPdfFilename(
          data.teacherName,
          data.periodName || selectedPeriodName
        );
        openPdfWithFilename(url, filename);
        toast({ title: "PDF generado" });
      }
    } catch (e) {
      toastPdfError(e);
    } finally {
      setLoading(null);
    }
  }, [
    teacherId,
    periodId,
    selectedPeriodName,
    group2Multiplier,
    group3Multiplier,
    toast,
    toastPdfError,
  ]);

  const handleAllPdf = useCallback(async () => {
    if (!periodId) {
      toast({
        title: "Selecciona un período",
        variant: "destructive",
      });
      return;
    }
    setLoading("all");
    try {
      const data = await getReportDataForAllTeachers(periodId);
      if (data?.length) {
        const periodName = selectedPeriodName || "Periodo";
        const url = await generateAllTeachersPdf(
          { periodName, teachers: data },
          {
            group2StudentMultiplier: group2Multiplier,
            group3StudentMultiplier: group3Multiplier,
          }
        );
        openPdfWithFilename(url, buildReportPdfFilename("todos", periodName));
        toast({ title: "PDF de todos los profesores generado" });
      } else {
        toast({ title: "No hay datos para el período seleccionado", variant: "destructive" });
      }
    } catch (e) {
      toastPdfError(e);
    } finally {
      setLoading(null);
    }
  }, [
    periodId,
    selectedPeriodName,
    group2Multiplier,
    group3Multiplier,
    toast,
    toastPdfError,
  ]);

  const handleStudentPdf = useCallback(async () => {
    if (!studentId || !periodId) {
      toast({
        title: "Selecciona alumno y período",
        variant: "destructive",
      });
      return;
    }
    setLoading("student");
    try {
      const data = await getReportDataForStudent(studentId, periodId);
      if (!data) {
        toast({ title: "Alumno no encontrado", variant: "destructive" });
        return;
      }
      const url = await generateStudentAttendancePdf(data);
      window.open(url, "_blank");
      toast({ title: "PDF de alumno generado" });
    } catch (e) {
      toastPdfError(e);
    } finally {
      setLoading(null);
    }
  }, [studentId, periodId, toast, toastPdfError]);

  return (
    <Tabs defaultValue="teacher" className="w-full space-y-3">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="teacher">Profesores</TabsTrigger>
        <TabsTrigger value="all-teachers">Todos los profesores</TabsTrigger>
        <TabsTrigger value="student">Alumnos</TabsTrigger>
      </TabsList>

      <TabsContent value="teacher" className="mt-0">
        <Card className="border border-border/80 shadow-none">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-[13px] font-medium">PDF de un profesor</CardTitle>
            <CardDescription className="text-[12px]">
              Genera el informe de clases y asistencias de un profesor en un período.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0">
            <div className="space-y-2">
              <Label htmlFor="report-teacher" className="text-[13px]">
                Profesor
              </Label>
              <Select value={teacherId} onValueChange={setTeacherId}>
                <SelectTrigger id="report-teacher">
                  <SelectValue placeholder="Seleccionar profesor" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.profiles?.full_name ?? t.profiles?.email ?? t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ReportPeriodField
              id="report-period-one"
              label="Período"
              value={periodId}
              onChange={setPeriodId}
              periods={periods}
            />
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mult-2" className="text-[13px]">
                  Multiplicador (2 alumnos)
                </Label>
                <Input
                  id="mult-2"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={group2Multiplier}
                  onChange={(e) => setGroup2Multiplier(Number(e.target.value || 0))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mult-3" className="text-[13px]">
                  Multiplicador (3+ alumnos)
                </Label>
                <Input
                  id="mult-3"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={group3Multiplier}
                  onChange={(e) => setGroup3Multiplier(Number(e.target.value || 0))}
                />
              </div>
            </div>
            {selectedPeriodName ? (
              <div className="text-[12px] text-muted-foreground">
                Se mostrará como <span className="font-medium">Period: {selectedPeriodName}</span> en
                el PDF.
              </div>
            ) : null}
            <ReportPdfButton
              loading={loading}
              activeKey="one"
              disabled={!teacherId || !periodId}
              onClick={() => void handleTeacherPdf()}
            >
              Generar PDF
            </ReportPdfButton>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="all-teachers" className="mt-0">
        <Card className="border border-border/80 shadow-none">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-[13px] font-medium">PDF de todos los profesores</CardTitle>
            <CardDescription className="text-[12px]">
              Genera un informe consolidado de todos los profesores en un período.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0">
            <ReportPeriodField
              id="report-period-all"
              label="Período"
              value={periodId}
              onChange={setPeriodId}
              periods={periods}
            />
            {/* <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mult-2-all" className="text-[13px]">
                  Multiplicador (2 alumnos)
                </Label>
                <Input
                  id="mult-2-all"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={group2Multiplier}
                  onChange={(e) => setGroup2Multiplier(Number(e.target.value || 0))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mult-3-all" className="text-[13px]">
                  Multiplicador (3+ alumnos)
                </Label>
                <Input
                  id="mult-3-all"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={group3Multiplier}
                  onChange={(e) => setGroup3Multiplier(Number(e.target.value || 0))}
                />
              </div>
            </div> */}
            <ReportPdfButton
              loading={loading}
              activeKey="all"
              disabled={!periodId}
              onClick={() => void handleAllPdf()}
            >
              Generar PDF todos
            </ReportPdfButton>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="student" className="mt-0">
        <Card className="border border-border/80 shadow-none">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-[13px] font-medium">PDF de alumno</CardTitle>
            <CardDescription className="text-[12px]">
              Genera un informe de todas las clases a las que asistió un alumno en el período
              seleccionado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="report-student" className="text-[13px]">
                  Alumno
                </Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger id="report-student">
                    <SelectValue placeholder="Seleccionar alumno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ReportPeriodField
                id="report-period-student"
                label="Período"
                value={periodId}
                onChange={setPeriodId}
                periods={periods}
              />
            </div>
            <ReportPdfButton
              loading={loading}
              activeKey="student"
              disabled={!studentId || !periodId}
              onClick={() => void handleStudentPdf()}
            >
              Generar PDF alumno
            </ReportPdfButton>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getReportDataForTeacher, getReportDataForAllTeachers } from "@/app/admin/reports/actions";
import { generateTeacherPdf, generateAllTeachersPdf } from "@/lib/pdf";
import { useToast } from "@/hooks/use-toast";
import { FileDown, Loader2 } from "lucide-react";
import type { TeacherWithProfile } from "@/types";
import type { Period } from "@/types";
import { Input } from "@/components/ui/input";

interface ReportsViewProps {
  teachers: TeacherWithProfile[];
  periods: Period[];
}

export function ReportsView({ teachers, periods }: ReportsViewProps) {
  const [teacherId, setTeacherId] = useState<string>("");
  const [periodId, setPeriodId] = useState<string>("");
  const [loading, setLoading] = useState<"one" | "all" | null>(null);
  const [group2Multiplier, setGroup2Multiplier] = useState<number>(0.75);
  const [group3Multiplier, setGroup3Multiplier] = useState<number>(0.5);
  const { toast } = useToast();

  const selectedPeriodName = periods.find((p) => p.id === periodId)?.name ?? "";

  async function handleTeacherPdf() {
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
        window.open(url, "_blank");
        toast({ title: "PDF generado" });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo generar el PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  async function handleAllPdf() {
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
        const url = generateAllTeachersPdf(data);
        window.open(url, "_blank");
        toast({ title: "PDF de todos los profesores generado" });
      } else {
        toast({ title: "No hay datos para el período seleccionado", variant: "destructive" });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "No se pudo generar el PDF",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
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
          <div className="space-y-2">
            <Label htmlFor="report-period-one">Período</Label>
            <Select value={periodId} onValueChange={setPeriodId}>
              <SelectTrigger id="report-period-one">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <Button
            size="sm"
            className="h-8 rounded px-3 text-[13px] font-medium"
            onClick={handleTeacherPdf}
            disabled={loading !== null || !teacherId || !periodId}
          >
            {loading === "one" ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-3.5 w-3.5" />
            )}
            Generar PDF
          </Button>
        </CardContent>
      </Card>
      <Card className="border border-border/80 shadow-none">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-[13px] font-medium">PDF de todos los profesores</CardTitle>
          <CardDescription className="text-[12px]">
            Genera un informe consolidado de todos los profesores en un período.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-3 pt-0">
          <div className="space-y-2">
            <Label htmlFor="report-period-all" className="text-[13px]">
              Período
            </Label>
            <Select value={periodId} onValueChange={setPeriodId}>
              <SelectTrigger id="report-period-all">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            size="sm"
            className="h-8 rounded px-3 text-[13px] font-medium"
            onClick={handleAllPdf}
            disabled={loading !== null || !periodId}
          >
            {loading === "all" ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-3.5 w-3.5" />
            )}
            Generar PDF todos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

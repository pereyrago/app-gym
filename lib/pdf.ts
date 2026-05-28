import { jsPDF } from "jspdf";
import { formatClassDate } from "@/lib/app-timezone";
import {
  createPdfLayoutContext,
  drawBrandedHeader,
  drawTeacherReportSection,
  paginateIfNeeded,
  PDF_LOGO_RATIO_H,
  PDF_LOGO_RATIO_W,
  type ReportClassRow,
} from "@/lib/pdf-layout";

export type { ReportClassRow };

export interface TeacherReportRow {
  teacherName: string;
  periodName: string;
  classes: ReportClassRow[];
}

type TeacherPdfOptions = {
  group2StudentMultiplier?: number;
  group3StudentMultiplier?: number;
};

async function svgUrlToPngDataUrl(svgUrl: string, targetWidthPx = 600): Promise<string> {
  const svgText = await fetch(svgUrl).then((r) => {
    if (!r.ok) throw new Error(`No se pudo cargar el logo (${r.status})`);
    return r.text();
  });

  const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
  const svgObjectUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("No se pudo renderizar el logo"));
      i.src = svgObjectUrl;
    });

    const w = Math.max(1, Math.floor(targetWidthPx));
    const h = Math.max(1, Math.floor((w * PDF_LOGO_RATIO_H) / PDF_LOGO_RATIO_W));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo inicializar canvas");
    ctx.clearRect(0, 0, w, h);

    const scale = Math.min(w / (img.naturalWidth || w), h / (img.naturalHeight || h));
    const dw = (img.naturalWidth || w) * scale;
    const dh = (img.naturalHeight || h) * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(svgObjectUrl);
  }
}

export async function generateTeacherPdf(
  data: TeacherReportRow,
  options: TeacherPdfOptions = {}
): Promise<string> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const ctx = createPdfLayoutContext(doc);
  const logoPng = await svgUrlToPngDataUrl("/full_logo.svg");

  let y = drawBrandedHeader(ctx, ctx.marginTop, logoPng, {
    periodName: data.periodName,
    subtitle: "Resumen de clases durante el periodo",
    titleLine: data.teacherName,
  });

  y = drawTeacherReportSection(ctx, y, data.classes, {
    ...options,
    teacherName: data.teacherName,
    skipTeacherTitle: true,
  });

  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

export interface AllTeachersReportRow {
  teacherName: string;
  totalClasses: number;
  classes: ReportClassRow[];
}

export type AllTeachersPdfInput = {
  periodName: string;
  teachers: AllTeachersReportRow[];
};

export async function generateAllTeachersPdf(
  input: AllTeachersPdfInput,
  options: TeacherPdfOptions = {}
): Promise<string> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const ctx = createPdfLayoutContext(doc);
  const logoPng = await svgUrlToPngDataUrl("/full_logo.svg");

  const teachersWithClasses = input.teachers.filter((t) => t.classes.length > 0);
  const teachersEmpty = input.teachers.filter((t) => t.classes.length === 0);

  let y = drawBrandedHeader(ctx, ctx.marginTop, logoPng, {
    periodName: input.periodName,
    subtitle: "Informe consolidado de todos los profesores",
    titleLine: `Profesores con actividad: ${teachersWithClasses.length}`,
  });

  if (teachersWithClasses.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("No hay clases registradas en el período seleccionado.", ctx.marginLeft, y);
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }

  for (let i = 0; i < teachersWithClasses.length; i++) {
    const teacher = teachersWithClasses[i];
    if (i > 0) {
      doc.addPage();
      y = ctx.marginTop + 10;
    } else {
      y += 4;
    }

    y = paginateIfNeeded(ctx, y, 250);
    y = drawTeacherReportSection(ctx, y, teacher.classes, {
      ...options,
      teacherName: teacher.teacherName,
    });
    y += 6;
  }

  if (teachersEmpty.length > 0) {
    y = paginateIfNeeded(ctx, y, 240);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Profesores sin clases en el período", ctx.marginLeft, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(
      teachersEmpty.map((t) => t.teacherName).join(", "),
      ctx.tableW
    );
    doc.text(lines, ctx.marginLeft, y);
  }

  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

export interface StudentAttendanceReportRow {
  studentName: string;
  periodName: string;
  classes: Array<{
    class_date: string;
    classTypeName: string;
    teacherName: string;
    duration_minutes: number;
  }>;
}

export async function generateStudentAttendancePdf(
  data: StudentAttendanceReportRow
): Promise<string> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const ctx = createPdfLayoutContext(doc);
  const logoPng = await svgUrlToPngDataUrl("/full_logo.svg");

  let y = drawBrandedHeader(ctx, ctx.marginTop, logoPng, {
    periodName: data.periodName,
    subtitle: "Informe de asistencias del alumno",
    titleLine: data.studentName,
  });

  const { doc: pdf, marginLeft: tableX, tableW } = ctx;
  const rowH = 8;

  if (data.classes.length === 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Sin asistencias registradas para el período.", tableX, y);
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Detalle Cronológico de Clases", tableX, y);
  y += 6;

  const col1 = tableX;
  const col2 = tableX + tableW * 0.22;
  const col3 = tableX + tableW * 0.56;
  const col4 = tableX + tableW * 0.83;

  pdf.setFontSize(8);
  pdf.setDrawColor(180);
  pdf.setFillColor(250, 250, 250);
  pdf.rect(tableX, y, tableW, rowH, "FD");
  pdf.text("Fecha", col1 + 2, y + 5.5);
  pdf.text("Clase", col2 + 2, y + 5.5);
  pdf.text("Profesor", col3 + 2, y + 5.5);
  pdf.text("Duración", col4 + 2, y + 5.5);
  y += rowH;

  pdf.setFont("helvetica", "normal");
  for (const c of data.classes) {
    y = paginateIfNeeded(ctx, y);
    pdf.line(tableX, y, tableX + tableW, y);
    pdf.text(
      formatClassDate(c.class_date, "dd/MM/yyyy"),
      col1 + 2,
      y + 5
    );
    pdf.text(c.classTypeName, col2 + 2, y + 5, { maxWidth: col3 - col2 - 4 });
    pdf.text(c.teacherName, col3 + 2, y + 5, { maxWidth: col4 - col3 - 4 });
    pdf.text(`${c.duration_minutes} min`, col4 + 2, y + 5);
    y += rowH;
  }
  pdf.line(tableX, y, tableX + tableW, y);

  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

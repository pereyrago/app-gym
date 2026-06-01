import type { jsPDF } from "jspdf";
import { formatClassDate } from "@/lib/app-timezone";
import {
  buildTeacherLiquidationRows,
  calculateReportMetrics,
  type TeacherReportClassInput,
} from "@/lib/teacher-report";

export const PDF_LOGO_RATIO_W = 404;
export const PDF_LOGO_RATIO_H = 380;

export const PDF_MARGINS = {
  left: 10,
  top: 10,
  right: 10,
} as const;

export const PDF_ROW_H = 8;
export const PDF_PAGE_BREAK_Y = 275;

export type ReportClassRow = {
  classTypeName: string;
  class_date: string;
  start_time?: string;
  duration_minutes?: number;
  attendancesCount: number;
  studentNames: string[];
  status?: "success" | "cancel_by_student" | "cancel_by_teacher";
};

export type PdfLayoutContext = {
  doc: jsPDF;
  pageWidth: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  tableX: number;
  tableW: number;
};

export function createPdfLayoutContext(doc: jsPDF): PdfLayoutContext {
  const pageWidth = doc.internal.pageSize.getWidth();
  const { left, right, top } = PDF_MARGINS;
  return {
    doc,
    pageWidth,
    marginLeft: left,
    marginRight: right,
    marginTop: top,
    tableX: left,
    tableW: pageWidth - left - right,
  };
}

export function formatPdfNumber(n: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(n);
}

export function paginateIfNeeded(
  ctx: PdfLayoutContext,
  y: number,
  threshold = PDF_PAGE_BREAK_Y
): number {
  if (y > threshold) {
    ctx.doc.addPage();
    return ctx.marginTop + 10;
  }
  return y;
}

export function drawBrandedHeader(
  ctx: PdfLayoutContext,
  y: number,
  logoPng: string,
  options: {
    periodName: string;
    subtitle: string;
    titleLine?: string;
  }
): number {
  const { doc, pageWidth, marginLeft, marginTop } = ctx;
  const logoW = 22;
  const logoH = (logoW * PDF_LOGO_RATIO_H) / PDF_LOGO_RATIO_W;
  doc.addImage(logoPng, "PNG", marginLeft, marginTop, logoW, logoH);

  const headerY = marginTop + 7.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Salud y Rendimiento", marginLeft + logoW + 6, headerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(options.subtitle, marginLeft + logoW + 6, headerY + 6);
  doc.text(`Periodo: ${options.periodName}`, pageWidth - ctx.marginRight, headerY, {
    align: "right",
  });

  let nextY = marginTop + logoH + 14;
  if (options.titleLine) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(options.titleLine, marginLeft, nextY);
    nextY += 8;
  }
  return nextY;
}

export function drawKeyIndicators(
  ctx: PdfLayoutContext,
  y: number,
  classes: ReportClassRow[]
): number {
  const { doc, tableX, tableW } = ctx;
  const metrics = calculateReportMetrics(classes as TeacherReportClassInput[]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Indicadores Clave del Período", tableX, y);
  y += 6;

  const cardW = tableW / 3 - 2;
  const cardH = 15;
  const row1Y = y;
  const row2Y = y + cardH + 2;

  const drawCard = (label: string, value: string, x: number, cardY: number) => {
    doc.setDrawColor(220);
    doc.setFillColor(252, 252, 252);
    doc.roundedRect(x, cardY, cardW, cardH, 1, 1, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(label, x + 2, cardY + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(value, x + 2, cardY + 11);
  };

  drawCard("Horas trabajadas", `${formatPdfNumber(metrics.workedHours)} hs`, tableX, row1Y);
  drawCard("Clases dictadas", String(metrics.classesTaught), tableX + cardW + 3, row1Y);
  drawCard("Alumnos asistentes", String(metrics.uniqueStudents), tableX + (cardW + 3) * 2, row1Y);

  drawCard("Asistencias totales", String(metrics.totalAttendances), tableX, row2Y);
  drawCard("Clases canceladas", String(metrics.cancelledClasses), tableX + cardW + 3, row2Y);
  drawCard(
    "Promedio alumnos/clase",
    formatPdfNumber(metrics.avgStudentsPerClass),
    tableX + (cardW + 3) * 2,
    row2Y
  );

  return row2Y + cardH + 10;
}

export function drawTeacherSummaryLine(
  ctx: PdfLayoutContext,
  y: number,
  classes: ReportClassRow[]
): number {
  // This function is being replaced by drawKeyIndicators, but we'll keep it for now if needed.
  return y;
}

export function drawLiquidationTable(
  ctx: PdfLayoutContext,
  y: number,
  classes: ReportClassRow[],
  options: { group2StudentMultiplier?: number; group3StudentMultiplier?: number }
): number {
  const { doc, tableX, tableW } = ctx;
  const rowH = PDF_ROW_H;
  const colType = tableX;
  const colClass = tableX + tableW * 0.32;
  const colQty = tableX + tableW * 0.55;
  const colTotalAlumnos = tableX + tableW * 0.68;
  const colTot = tableX + tableW * 0.85;

  const rows = buildTeacherLiquidationRows(classes as TeacherReportClassInput[], options);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Resumen de Liquidación", tableX, y);
  y += 6;

  if (rows.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Sin clases registradas para el período.", tableX, y);
    return y + 8;
  }

  doc.setDrawColor(180);
  doc.setFillColor(245, 245, 245);
  doc.rect(tableX, y, tableW, rowH, "FD");
  doc.setFontSize(9);
  doc.text("Tipo de Clase", colType + 2, y + 5.5);
  doc.text("Categoría", colClass + 2, y + 5.5);
  doc.text("Cant.", colQty + 2, y + 5.5);
  doc.text("Total alumnos", colTotalAlumnos + 2, y + 5.5);
  doc.text("Total", colTot + 2, y + 5.5);
  y += rowH;

  doc.setFont("helvetica", "normal");
  let grandTotal = 0;
  for (const r of rows) {
    doc.rect(tableX, y, tableW, rowH);
    doc.text(r.type, colType + 2, y + 5.5, { maxWidth: colClass - colType - 4 });
    doc.text(r.label, colClass + 2, y + 5.5);
    doc.text(String(r.qty), colQty + 2, y + 5.5);
    doc.text(String(r.totalAlumnos), colTotalAlumnos + 2, y + 5.5);
    doc.text(formatPdfNumber(r.total), colTot + 2, y + 5.5);
    grandTotal += r.total;
    y += rowH;
  }

  doc.setFont("helvetica", "bold");
  doc.rect(tableX, y, tableW, rowH);
  doc.text("TOTAL UNIDADES", colTotalAlumnos - 28, y + 5.5);
  doc.text(formatPdfNumber(grandTotal), colTot + 2, y + 5.5);
  return y + rowH + 10;
}

export function drawChronologicalTable(
  ctx: PdfLayoutContext,
  y: number,
  classes: ReportClassRow[]
): number {
  const { doc, tableX, tableW } = ctx;
  const rowH = PDF_ROW_H;

  y = paginateIfNeeded(ctx, y, 240);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle Cronológico de Clases", tableX, y);
  y += 6;

  if (classes.length === 0) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Sin clases en el período.", tableX, y);
    return y + 8;
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setDrawColor(180);
  doc.setFillColor(250, 250, 250);
  doc.rect(tableX, y, tableW, rowH, "FD");
  doc.text("Fecha", tableX + 2, y + 5.5);
  doc.text("Tipo", tableX + 30, y + 5.5);
  doc.text("Alumnos", tableX + 75, y + 5.5);
  y += rowH;

  doc.setFont("helvetica", "normal");
  const alumnosMaxW = Math.max(1, tableW - 77);

  for (const c of classes) {
    y = paginateIfNeeded(ctx, y);

    const studentsStr =
      c.studentNames.length === 0 ? "Sin asistentes" : c.studentNames.join(", ");
    const classInfo = `${c.classTypeName} (${c.duration_minutes ?? 60}m)`;
    const studentLines = doc.splitTextToSize(studentsStr, alumnosMaxW);

    doc.line(tableX, y, tableX + tableW, y);
    doc.text(formatClassDate(c.class_date, "dd/MM/yyyy"), tableX + 2, y + 5);
    doc.text(classInfo, tableX + 30, y + 5);
    doc.text(studentLines, tableX + 75, y + 5);

    const textHeight = doc.getTextDimensions(studentLines).h;
    y += Math.max(7, textHeight + 3);
  }

  doc.line(tableX, y, tableX + tableW, y);
  return y + 8;
}

export function drawTeacherReportSection(
  ctx: PdfLayoutContext,
  y: number,
  classes: ReportClassRow[],
  options: {
    group2StudentMultiplier?: number;
    group3StudentMultiplier?: number;
    skipTeacherTitle?: boolean;
    teacherName?: string;
  } = {}
): number {
  const { doc, marginLeft } = ctx;

  if (!options.skipTeacherTitle && options.teacherName) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(options.teacherName, marginLeft, y);
    y += 7;
  }

  y = drawKeyIndicators(ctx, y, classes);
  y = drawLiquidationTable(ctx, y, classes, {
    group2StudentMultiplier: options.group2StudentMultiplier,
    group3StudentMultiplier: options.group3StudentMultiplier,
  });
  y = drawChronologicalTable(ctx, y, classes);
  return y;
}

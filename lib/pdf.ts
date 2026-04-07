import { jsPDF } from "jspdf";
import { formatClassDate } from "@/lib/app-timezone";

export interface TeacherReportRow {
  teacherName: string;
  periodName: string;
  classes: Array<{
    classTypeName: string;
    class_date: string;
    start_time?: string;
    duration_minutes?: number;
    attendancesCount: number;
    studentNames: string[];
  }>;
}

type TeacherPdfOptions = {
  group2StudentMultiplier?: number; // cada alumno paga este % del valor base (ej: 0.75)
  group3StudentMultiplier?: number; // para 3 o más alumnos (ej: 0.5)
};

const LOGO_RATIO_W = 404;
const LOGO_RATIO_H = 380;

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
    const h = Math.max(1, Math.floor((w * LOGO_RATIO_H) / LOGO_RATIO_W));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo inicializar canvas");
    ctx.clearRect(0, 0, w, h);

    // Dibuja centrado respetando el ratio 404x380 (sin estirar)
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

function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(n);
}

export async function generateTeacherPdf(
  data: TeacherReportRow,
  options: TeacherPdfOptions = {}
): Promise<string> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  const marginLeft = 10; // 1cm
  const marginTop = 10; // 1cm
  const marginRight = 10;

  const group2StudentMultiplier = options.group2StudentMultiplier ?? 0.75;
  const group3StudentMultiplier = options.group3StudentMultiplier ?? 0.5;

  // Header
  let y = marginTop;
  const logoPng = await svgUrlToPngDataUrl("/full_logo.svg");
  const logoW = 22;
  const logoH = (logoW * LOGO_RATIO_H) / LOGO_RATIO_W;
  doc.addImage(logoPng, "PNG", marginLeft, marginTop, logoW, logoH);

  const headerY = marginTop + 7.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Salud y Rendimiento", marginLeft + logoW + 6, headerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "Resumen de clases durante el periodo",
    marginLeft + logoW + 6,
    headerY + 6
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Periodo: ${data.periodName}`, pageWidth - marginRight, headerY, { align: "right" });

  y = marginTop + logoH + 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(data.teacherName, marginLeft, y);
  
  const totalMinutes = data.classes.reduce((sum, c) => sum + (c.duration_minutes ?? 60), 0);
  const totalHours = totalMinutes / 60;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Total de horas trabajadas en el periodo: ${formatNumber(totalHours)} hs`, marginLeft, y + 5);
  y += 15;

  function countBy(duration: 60 | 90) {
    const counts = { one: 0, two: 0, threePlus: 0 };
    for (const c of data.classes) {
      const dur = (c.duration_minutes ?? 60) === 90 ? 90 : 60;
      if (dur !== duration) continue;
      if (c.attendancesCount <= 1) counts.one += 1;
      else if (c.attendancesCount === 2) counts.two += 1;
      else counts.threePlus += 1;
    }
    return counts;
  }

  const has90 = data.classes.some((c) => (c.duration_minutes ?? 60) === 90);

  const rows: Array<{
    label: string;
    type: string;
    qty: number;
    students: number;
    multiplier: number;
    total: number;
  }> = [];

  // Agrupamos por Type + Duration + StudentsCount (1, 2, 3+)
  const groups: Record<string, { qty: number; type: string; dur: number; count: number }> = {};
  for (const c of data.classes) {
    const dur = (c.duration_minutes ?? 60) === 90 ? 90 : 60;
    const cat = c.attendancesCount <= 1 ? 1 : c.attendancesCount === 2 ? 2 : 3;
    const key = `${c.classTypeName}-${dur}-${cat}`;
    if (!groups[key]) {
      groups[key] = { qty: 0, type: c.classTypeName, dur, count: cat };
    }
    groups[key].qty++;
  }

  for (const key in groups) {
    const g = groups[key];
    const mult = g.count === 1 ? 1 : g.count === 2 ? group2StudentMultiplier : group3StudentMultiplier;
    const label = g.count === 1 ? "Individual" : g.count === 2 ? "Grupal (2)" : "Grupal (3+)";
    rows.push({
      label: `${label} x ${g.dur}m`,
      type: g.type,
      qty: g.qty,
      students: g.count,
      multiplier: mult,
      total: g.qty * g.count * mult,
    });
  }

  doc.setFontSize(10);
  const tableX = marginLeft;
  const tableW = pageWidth - marginLeft - marginRight;
  const colType = tableX;
  const colClass = tableX + tableW * 0.35;
  const colQty = tableX + tableW * 0.58;
  const colStud = tableX + tableW * 0.70;
  const colMult = tableX + tableW * 0.82;
  const colTot = tableX + tableW * 0.92;
  const rowH = 8;

  doc.setFont("helvetica", "bold");
  doc.text("Resumen de Liquidación", tableX, y);
  y += 6;

  if (rows.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Sin clases registradas para el período.", tableX, y);
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }

  // Header row
  doc.setDrawColor(180);
  doc.setFillColor(245, 245, 245);
  doc.rect(tableX, y, tableW, rowH, "FD");
  doc.setFontSize(9);
  doc.text("Tipo de Clase", colType + 2, y + 5.5);
  doc.text("Categoría", colClass + 2, y + 5.5);
  doc.text("Cant.", colQty + 2, y + 5.5);
  doc.text("Alum.", colStud + 2, y + 5.5);
  doc.text("Mult.", colMult + 2, y + 5.5);
  doc.text("Total", colTot + 2, y + 5.5);
  y += rowH;

  doc.setFont("helvetica", "normal");
  let grandTotal = 0;
  for (const r of rows) {
    doc.rect(tableX, y, tableW, rowH);
    doc.text(r.type, colType + 2, y + 5.5, { maxWidth: colClass - colType - 4 });
    doc.text(r.label, colClass + 2, y + 5.5);
    doc.text(String(r.qty), colQty + 2, y + 5.5);
    doc.text(String(r.students), colStud + 2, y + 5.5);
    doc.text(formatNumber(r.multiplier), colMult + 2, y + 5.5);
    doc.text(formatNumber(r.total), colTot + 2, y + 5.5);
    grandTotal += r.total;
    y += rowH;
  }

  doc.setFont("helvetica", "bold");
  doc.rect(tableX, y, tableW, rowH);
  doc.text("TOTAL UNIDADES", colMult - 20, y + 5.5);
  doc.text(formatNumber(grandTotal), colTot + 2, y + 5.5);
  y += rowH + 12;

  // Detalle de clases
  if (y > 240) {
    doc.addPage();
    y = marginTop + 10;
  }

  doc.setFontSize(11);
  doc.text("Detalle Cronológico de Clases", tableX, y);
  y += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setFillColor(250, 250, 250);
  doc.rect(tableX, y, tableW, rowH, "FD");
  doc.text("Fecha", tableX + 2, y + 5.5);
  doc.text("Tipo", tableX + 30, y + 5.5);
  doc.text("Alumnos", tableX + 75, y + 5.5);
  y += rowH;

  doc.setFont("helvetica", "normal");
  for (const c of data.classes) {
    if (y > 275) {
      doc.addPage();
      y = marginTop + 10;
    }
    const studentsStr = c.studentNames.join(", ");
    const classInfo = `${c.classTypeName} (${c.duration_minutes}m)`;
    const alumnosMaxW = Math.max(1, tableW - 77);
    const studentLines =
      studentsStr.length === 0 ? [""] : doc.splitTextToSize(studentsStr, alumnosMaxW);

    doc.text(formatClassDate(c.class_date, "dd/MM/yyyy"), tableX + 2, y + 5);
    doc.text(classInfo, tableX + 30, y + 5);
    doc.text(studentLines, tableX + 75, y + 5);

    const textHeight = doc.getTextDimensions(studentLines).h;
    const finalRowH = Math.max(7, textHeight + 3);
    
    doc.line(tableX, y, tableX + tableW, y); // linea superior de fila
    y += finalRowH;
  }
  doc.line(tableX, y, tableX + tableW, y); // linea final

  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

export interface AllTeachersReportRow {
  teacherName: string;
  totalClasses: number;
  classes: Array<{
    classTypeName: string;
    class_date: string;
    start_time?: string;
    duration_minutes?: number;
    attendancesCount: number;
  }>;
}

export function generateAllTeachersPdf(data: AllTeachersReportRow[]): string {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.text("Informe global - Todos los profesores", pageWidth / 2, y, {
    align: "center",
  });
  y += 20;

  doc.setFontSize(10);
  for (const teacher of data) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text(teacher.teacherName, 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const totalMinutes = teacher.classes.reduce((sum, c) => sum + (c.duration_minutes ?? 60), 0);
    const totalHours = totalMinutes / 60;
    doc.text(`Total clases: ${teacher.totalClasses}  |  Total horas: ${formatNumber(totalHours)} hs`, 14, y);
    y += 8;
    for (const c of teacher.classes) {
      doc.text(
        `  ${formatClassDate(c.class_date, "d MMM yyyy")} - ${c.classTypeName} (${c.attendancesCount} asistentes)`,
        14,
        y
      );
      y += 5;
    }
    y += 8;
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
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 10;
  const marginTop = 10;
  const marginRight = 10;
  const logoPng = await svgUrlToPngDataUrl("/full_logo.svg");
  const logoW = 22;
  const logoH = (logoW * LOGO_RATIO_H) / LOGO_RATIO_W;
  doc.addImage(logoPng, "PNG", marginLeft, marginTop, logoW, logoH);

  const headerY = marginTop + 7.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Salud y Rendimiento", marginLeft + logoW + 6, headerY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Periodo: ${data.periodName}`, pageWidth - marginRight, headerY, { align: "right" });

  let y = marginTop + logoH + 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Informe de alumno: ${data.studentName}`, marginLeft, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (data.classes.length === 0) {
    doc.text("Sin asistencias registradas para el período.", marginLeft, y);
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }

  const tableX = marginLeft;
  const tableW = pageWidth - marginLeft - marginRight;
  const col1 = tableX;
  const col2 = tableX + tableW * 0.22;
  const col3 = tableX + tableW * 0.56;
  const col4 = tableX + tableW * 0.83;
  const rowH = 8;

  doc.setFont("helvetica", "bold");
  doc.rect(tableX, y, tableW, rowH);
  doc.text("Fecha", col1 + 2, y + 5.5);
  doc.text("Clase", col2 + 2, y + 5.5);
  doc.text("Profesor", col3 + 2, y + 5.5);
  doc.text("Duración", col4 + 2, y + 5.5);
  y += rowH;
  doc.setFont("helvetica", "normal");

  for (const c of data.classes) {
    if (y > 280) {
      doc.addPage();
      y = 18;
      doc.setFont("helvetica", "bold");
      doc.rect(tableX, y, tableW, rowH);
      doc.text("Fecha", col1 + 2, y + 5.5);
      doc.text("Clase", col2 + 2, y + 5.5);
      doc.text("Profesor", col3 + 2, y + 5.5);
      doc.text("Duración", col4 + 2, y + 5.5);
      y += rowH;
      doc.setFont("helvetica", "normal");
    }
    doc.rect(tableX, y, tableW, rowH);
    doc.text(formatClassDate(c.class_date, "d MMM yyyy"), col1 + 2, y + 5.5);
    doc.text(c.classTypeName, col2 + 2, y + 5.5);
    doc.text(c.teacherName, col3 + 2, y + 5.5);
    doc.text(`${c.duration_minutes} min`, col4 + 2, y + 5.5);
    y += rowH;
  }

  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

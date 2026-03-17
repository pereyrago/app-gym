import { jsPDF } from "jspdf";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

    const ratio = img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 3;
    const w = Math.max(1, Math.floor(targetWidthPx));
    const h = Math.max(1, Math.floor(w / ratio));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo inicializar canvas");
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

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
  const logoW = 38;
  const logoH = 14;
  doc.addImage(logoPng, "PNG", marginLeft, marginTop, logoW, logoH);

  const headerY = marginTop + 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Salud y Rendimiento", marginLeft + logoW + 6, headerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Period: ${data.periodName}`, pageWidth - marginRight, headerY, { align: "right" });

  y = marginTop + logoH + 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(data.teacherName, marginLeft, y);
  y += 10;

  // Summary table (por cantidad de alumnos)
  const counts = { one: 0, two: 0, threePlus: 0 };
  for (const c of data.classes) {
    if (c.attendancesCount <= 1) counts.one += 1;
    else if (c.attendancesCount === 2) counts.two += 1;
    else counts.threePlus += 1;
  }

  const rows = [
    {
      label: "Clases individuales x 60min",
      qty: counts.one,
      students: 1,
      total: counts.one * 1 * 1,
    },
    {
      label: "Clases grupales (2) x 60min",
      qty: counts.two,
      students: 2,
      total: counts.two * 2 * group2StudentMultiplier,
    },
    {
      label: "Clases grupales (3) x 60min",
      qty: counts.threePlus,
      students: 3,
      total: counts.threePlus * 3 * group3StudentMultiplier,
    },
  ];

  doc.setFontSize(10);
  const tableX = marginLeft;
  const tableW = pageWidth - marginLeft - marginRight;
  const col1 = tableX;
  const col2 = tableX + tableW * 0.58;
  const col3 = tableX + tableW * 0.74;
  const col4 = tableX + tableW * 0.86;
  const rowH = 8;

  doc.setFont("helvetica", "bold");
  doc.text("Resumen", tableX, y);
  y += 6;

  // Header row
  doc.setDrawColor(180);
  doc.rect(tableX, y, tableW, rowH);
  doc.text("Clase", col1 + 2, y + 5.5);
  doc.text("Cantidad", col2 + 2, y + 5.5);
  doc.text("Alumnos", col3 + 2, y + 5.5);
  doc.text("Total", col4 + 2, y + 5.5);
  y += rowH;

  doc.setFont("helvetica", "normal");
  for (const r of rows) {
    doc.rect(tableX, y, tableW, rowH);
    doc.text(r.label, col1 + 2, y + 5.5);
    doc.text(String(r.qty), col2 + 2, y + 5.5);
    doc.text(String(r.students), col3 + 2, y + 5.5);
    doc.text(formatNumber(r.total), col4 + 2, y + 5.5);
    y += rowH;
  }

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
    doc.text(`Total clases: ${teacher.totalClasses}`, 14, y);
    y += 8;
    for (const c of teacher.classes) {
      doc.text(
        `  ${format(new Date(c.class_date), "d MMM yyyy", { locale: es })} - ${c.classTypeName} (${c.attendancesCount} asistentes)`,
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

/** Segmento seguro para nombres de archivo PDF (Windows / macOS / Linux). */
export function sanitizePdfFilenameSegment(value: string): string {
  const cleaned = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "documento";
}

export function buildReportPdfFilename(...segments: string[]): string {
  return `${segments.map(sanitizePdfFilenameSegment).join("-")}.pdf`;
}

/** Descarga con nombre sugerido y abre vista previa en otra pestaña. */
export function openPdfWithFilename(blobUrl: string, filename: string): void {
  const name = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;

  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = name;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.open(blobUrl, "_blank", "noopener,noreferrer");

  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
}

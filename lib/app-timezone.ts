import { toZonedTime, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/** Zona horaria con la que se crean y muestran las clases (misma que en el formulario de creación). */
export const APP_TIMEZONE =
  process.env.NEXT_PUBLIC_APP_TIMEZONE ?? "America/Argentina/Buenos_Aires";

/** Fecha/hora actual en la zona de la app. */
export function nowInAppTz(): Date {
  return toZonedTime(new Date(), APP_TIMEZONE);
}

/** Convierte fecha (YYYY-MM-DD) + hora (HH:MM) interpretados en la zona de la app a un Date (instant UTC). */
export function parseClassDateTimeInAppTz(classDate: string, startTime: string): Date {
  const timeStr = String(startTime).slice(0, 5);
  const [y, mo, day] = classDate.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  const localDate = new Date(y, (mo ?? 1) - 1, day ?? 1, h ?? 0, min ?? 0, 0);
  return fromZonedTime(localDate, APP_TIMEZONE);
}

/** Fecha en zona app como YYYY-MM-DD. */
export function toAppTzDateString(d: Date): string {
  const zoned = toZonedTime(d, APP_TIMEZONE);
  return format(zoned, "yyyy-MM-dd");
}

/** Formatea una hora (HH:MM o HH:MM:SS) para mostrar en la UI (solo hora local, ya guardada en esa zona). */
export function formatTimeForDisplay(timeStr: string): string {
  return String(timeStr).slice(0, 5);
}

/**
 * Formatea una fecha guardada como YYYY-MM-DD (sin hora) para mostrar en la UI.
 * Evita que en zonas horarias al oeste de UTC se muestre el día anterior (ej. 17/3 guardado mostrándose como 16).
 */
export function formatClassDate(
  dateStr: string,
  pattern: string = "d MMM",
  locale: typeof es = es
): string {
  const parts = dateStr.split("-").map(Number);
  const [y, m, day] = parts;
  if (y == null || m == null || day == null) return dateStr;
  const utcNoon = new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
  return formatInTimeZone(utcNoon, APP_TIMEZONE, pattern, { locale });
}

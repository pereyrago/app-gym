import { parseClassDateTimeInAppTz } from "@/lib/app-timezone";

/**
 * Regla de negocio: la clase se puede editar desde que se crea hasta 24 horas
 * después de la hora de inicio de la misma. Coincide con RLS en el servidor.
 */
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/** Indica si una clase puede editarse (hasta 24h después de su hora de inicio). */
export function classCanBeEdited(classDate: string, startTime: string): boolean {
  const classStart = parseClassDateTimeInAppTz(
    classDate,
    String(startTime ?? "09:00").slice(0, 5)
  ).getTime();
  const now = Date.now();
  return now <= classStart + TWENTY_FOUR_HOURS_MS;
}

export function getClassEditableMessage(classDate: string, startTime: string): string {
  return classCanBeEdited(classDate, startTime)
    ? "Editable (hasta 24h después del inicio)"
    : "No editable (pasaron más de 24h desde el inicio)";
}

import { isClassEditableAt } from "@/lib/class-schedule-rules";

export { CLASS_EDIT_WINDOW_MS } from "@/lib/class-schedule-rules";

/**
 * Indica si una clase puede editarse: hasta 24h después del instante de inicio programado.
 * Coincide con `public.class_can_edit(class_date, start_time)` en el servidor.
 */
export function classCanBeEdited(classDate: string, startTime: string): boolean {
  return isClassEditableAt(classDate, startTime, Date.now());
}

export function getClassEditableMessage(classDate: string, startTime: string): string {
  return classCanBeEdited(classDate, startTime)
    ? "Editable (hasta 24h después del inicio)"
    : "No editable (pasaron más de 24h desde el inicio)";
}

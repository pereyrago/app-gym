/**
 * Reglas de dominio para clases: ventana de edición (creación sin límite de fecha).
 *
 * Edición: hasta 24h después del **instante de inicio** programado de la clase
 * (misma semántica que `class_can_edit` en Postgres). No usa `created_at`.
 *
 * Comparaciones de instantes: siempre en milisegundos UTC (`Date.now()` / `.getTime()`).
 */

import { parseClassDateTimeInAppTz } from "@/lib/app-timezone";

export const CLASS_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Mensaje cuando la ventana de edición ya cerró. */
export const CLASS_NOT_EDITABLE_MESSAGE =
  "Esta clase ya no puede editarse (pasaron más de 24 horas desde el inicio).";

export function getClassStartInstantMs(classDate: string, startTime: string): number {
  return parseClassDateTimeInAppTz(
    classDate,
    String(startTime ?? "09:00").slice(0, 5)
  ).getTime();
}

/** Fin de la ventana de edición: instante de inicio + 24h (UTC ms). */
export function getClassEditWindowEndMs(classDate: string, startTime: string): number {
  return getClassStartInstantMs(classDate, startTime) + CLASS_EDIT_WINDOW_MS;
}

/**
 * ¿Se puede editar en `referenceInstantMs`? Debe usarse `Date.now()` (o el mismo reloj
 * que `parseClassDateTimeInAppTz`) para no mezclar "ahora" con representaciones locales incorrectas.
 */
export function isClassEditableAt(
  classDate: string,
  startTime: string,
  referenceInstantMs: number = Date.now()
): boolean {
  return referenceInstantMs <= getClassEditWindowEndMs(classDate, startTime);
}

export function assertClassEditable(
  classDate: string,
  startTime: string,
  referenceInstantMs: number = Date.now()
): void {
  if (!isClassEditableAt(classDate, startTime, referenceInstantMs)) {
    throw new Error(CLASS_NOT_EDITABLE_MESSAGE);
  }
}

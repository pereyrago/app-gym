/**
 * Reglas de dominio para programación de clases (creación vs ventana de edición).
 *
 * - Creación: solo se prohíbe que la **fecha calendario** de la clase sea anterior
 *   al día actual en APP_TIMEZONE. La hora del mismo día no importa.
 * - Edición: hasta 24h después del **instante de inicio** programado de la clase
 *   (misma semántica que `class_can_edit` en Postgres). No usa `created_at`.
 *
 * Comparaciones de instantes: siempre en milisegundos UTC (`Date.now()` / `.getTime()`).
 */

import { parseClassDateTimeInAppTz, toAppTzDateString } from "@/lib/app-timezone";

export const CLASS_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Mensaje al fallar validación de creación (día calendario pasado). */
export const CLASS_CREATE_PAST_DAY_MESSAGE =
  "No se pueden registrar clases en días anteriores al día actual.";

/** Mensaje cuando la ventana de edición ya cerró. */
export const CLASS_NOT_EDITABLE_MESSAGE =
  "Esta clase ya no puede editarse (pasaron más de 24 horas desde el inicio).";

/**
 * Compara dos fechas calendario YYYY-MM-DD interpretadas en el mismo convenio
 * (día civil de la app). Para formato ISO, el orden lexicográfico coincide con el cronológico.
 */
export function compareAppCalendarDateStrings(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * `true` si la fecha de clase es un día calendario estrictamente anterior a "hoy"
 * en APP_TIMEZONE.
 */
export function isClassCalendarDayInPast(
  classDate: string,
  referenceNow: Date = new Date()
): boolean {
  const todayYmd = toAppTzDateString(referenceNow);
  return compareAppCalendarDateStrings(classDate, todayYmd) < 0;
}

/** Puede crearse una clase con esta `class_date` (YYYY-MM-DD) en `referenceNow`. */
export function canCreateClassForCalendarDate(
  classDate: string,
  referenceNow: Date = new Date()
): boolean {
  return !isClassCalendarDayInPast(classDate, referenceNow);
}

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

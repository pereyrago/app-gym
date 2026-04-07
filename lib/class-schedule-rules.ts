/**
 * Reglas de dominio para clases. La edición/borrado ya no tiene ventana de tiempo fija
 * (antes: 24h tras el inicio programado; alineado con RLS en `public.classes`).
 */

import { parseClassDateTimeInAppTz } from "@/lib/app-timezone";

/** @deprecated Sin ventana de edición; se mantiene por si algún código importa la constante. */
export const CLASS_EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** @deprecated Ya no se usa para bloquear edición. */
export const CLASS_NOT_EDITABLE_MESSAGE =
  "Esta clase ya no puede editarse (pasaron más de 24 horas desde el inicio).";

export function getClassStartInstantMs(classDate: string, startTime: string): number {
  return parseClassDateTimeInAppTz(
    classDate,
    String(startTime ?? "09:00").slice(0, 5)
  ).getTime();
}

/** @deprecated Sin límite de tiempo para editar. */
export function getClassEditWindowEndMs(classDate: string, startTime: string): number {
  return getClassStartInstantMs(classDate, startTime) + CLASS_EDIT_WINDOW_MS;
}

/** Siempre true: las clases pueden editarse sin tope de 24h desde el inicio. */
export function isClassEditableAt(
  _classDate: string,
  _startTime: string,
  _referenceInstantMs: number = Date.now()
): boolean {
  return true;
}

/** No-op: la edición no está restringida por tiempo. */
export function assertClassEditable(
  _classDate: string,
  _startTime: string,
  _referenceInstantMs: number = Date.now()
): void {}

/**
 * Utilidades de UI para clases. La edición ya no depende de una ventana de 24h.
 */

/** Siempre true (sin restricción por tiempo). */
export function classCanBeEdited(_classDate: string, _startTime: string): boolean {
  return true;
}

/** Texto para tooltips o ayuda contextual. */
export function getClassEditabilityLabel(_classDate: string, _startTime: string): string {
  return "Editable";
}

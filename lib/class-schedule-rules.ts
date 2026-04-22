/**
 * Reglas de dominio para clases: ventana de edición deshabilitada.
 * Se mantienen las funciones por compatibilidad con la UI y otras acciones,
 * pero ya no imponen restricciones de tiempo.
 */

export const CLASS_NOT_EDITABLE_MESSAGE = "Esta clase no puede editarse.";

export function isClassEditableAt(
  _classDate: string,
  _startTime: string,
  _referenceInstantMs: number = Date.now()
): boolean {
  // Se ha deshabilitado la restricción de 24 horas a petición del usuario. Siempre editable.
  return true;
}

export function assertClassEditable(
  _classDate: string,
  _startTime: string,
  _referenceInstantMs: number = Date.now()
): void {
  // Siempre editable: no lanza errores.
}

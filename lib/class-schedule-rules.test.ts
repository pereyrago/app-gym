import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  canCreateClassForCalendarDate,
  isClassCalendarDayInPast,
  isClassEditableAt,
  getClassEditWindowEndMs,
  getClassStartInstantMs,
  compareAppCalendarDateStrings,
} from "./class-schedule-rules";

describe("compareAppCalendarDateStrings", () => {
  it("orders YYYY-MM-DD chronologically", () => {
    expect(compareAppCalendarDateStrings("2025-01-01", "2025-12-31")).toBe(-1);
    expect(compareAppCalendarDateStrings("2025-12-31", "2025-01-01")).toBe(1);
    expect(compareAppCalendarDateStrings("2025-06-15", "2025-06-15")).toBe(0);
  });
});

describe("canCreateClassForCalendarDate (día civil en APP_TIMEZONE)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_TIMEZONE", "America/Argentina/Buenos_Aires");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("no permite crear clase para ayer", () => {
    const ref = new Date("2025-07-15T15:00:00.000Z"); // 15 jul ~12:00 ART
    expect(canCreateClassForCalendarDate("2025-07-14", ref)).toBe(false);
    expect(isClassCalendarDayInPast("2025-07-14", ref)).toBe(true);
  });

  it("no permite crear clase hace varios días", () => {
    const ref = new Date("2025-07-15T15:00:00.000Z");
    expect(canCreateClassForCalendarDate("2025-07-10", ref)).toBe(false);
  });

  it("permite crear clase hoy aunque la hora de inicio ya haya pasado (solo importa el día)", () => {
    const ref = new Date("2025-07-15T15:00:00.000Z"); // hoy 15 jul en ART
    expect(canCreateClassForCalendarDate("2025-07-15", ref)).toBe(true);
  });

  it("permite crear clase mañana", () => {
    const ref = new Date("2025-07-15T15:00:00.000Z");
    expect(canCreateClassForCalendarDate("2025-07-16", ref)).toBe(true);
  });

  /**
   * Borde medianoche ART: justo antes de las 00:00 del 15 en BA sigue siendo "hoy" el 14.
   * 2025-07-15T02:59:59.999Z → 23:59:59.999 del 14 en UTC-3.
   */
  it("respeta el cambio de día civil en la zona de la app (antes de medianoche local)", () => {
    const ref = new Date("2025-07-15T02:59:59.999Z");
    expect(canCreateClassForCalendarDate("2025-07-14", ref)).toBe(true);
    expect(canCreateClassForCalendarDate("2025-07-13", ref)).toBe(false);
    expect(canCreateClassForCalendarDate("2025-07-15", ref)).toBe(true);
  });

  /** 2025-07-15T03:00:00.000Z → 00:00 del 15 en ART: el 14 ya es pasado. */
  it("respeta el cambio de día civil en la zona de la app (después de medianoche local)", () => {
    const ref = new Date("2025-07-15T03:00:00.000Z");
    expect(canCreateClassForCalendarDate("2025-07-14", ref)).toBe(false);
    expect(canCreateClassForCalendarDate("2025-07-15", ref)).toBe(true);
  });
});

describe("isClassEditableAt (ventana = inicio programado + 24h, no created_at)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_TIMEZONE", "America/Argentina/Buenos_Aires");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("clase hoy con hora ya pasada: editable hasta 24h después del inicio", () => {
    // Ahora 18:00 ART del 12 mar 2025 = 12 mar 21:00 UTC
    vi.setSystemTime(new Date("2025-03-12T21:00:00.000Z"));
    // Clase hoy 10:00 ART → fin de ventana mañana 10:00 ART
    expect(isClassEditableAt("2025-03-12", "10:00")).toBe(true);
    const end = getClassEditWindowEndMs("2025-03-12", "10:00");
    expect(end).toBe(getClassStartInstantMs("2025-03-12", "10:00") + 24 * 60 * 60 * 1000);
  });

  it("clase hoy con hora futura: no bloqueada antes del inicio", () => {
    vi.setSystemTime(new Date("2025-03-12T14:00:00.000Z")); // ~11:00 ART
    expect(isClassEditableAt("2025-03-12", "18:00")).toBe(true);
  });

  it("clase mañana: sigue editable aunque hubieran pasado 24h desde creación (no se usa created_at)", () => {
    vi.setSystemTime(new Date("2025-03-12T14:00:00.000Z"));
    expect(isClassEditableAt("2025-03-13", "10:00")).toBe(true);
  });

  it("deja de ser editable pasadas más de 24h desde el inicio", () => {
    const now = new Date("2025-03-12T15:01:00.000Z");
    vi.setSystemTime(now);
    expect(isClassEditableAt("2025-03-11", "12:00")).toBe(false);
  });

  it("sigue siendo editable exactamente en el límite de 24h después del inicio", () => {
    const now = new Date("2025-03-12T15:00:00.000Z");
    vi.setSystemTime(now);
    expect(isClassEditableAt("2025-03-11", "12:00")).toBe(true);
  });
});

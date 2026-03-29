import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isClassEditableAt,
  getClassEditWindowEndMs,
  getClassStartInstantMs,
} from "./class-schedule-rules";

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
    vi.setSystemTime(new Date("2025-03-12T21:00:00.000Z"));
    expect(isClassEditableAt("2025-03-12", "10:00")).toBe(true);
    const end = getClassEditWindowEndMs("2025-03-12", "10:00");
    expect(end).toBe(getClassStartInstantMs("2025-03-12", "10:00") + 24 * 60 * 60 * 1000);
  });

  it("clase hoy con hora futura: no bloqueada antes del inicio", () => {
    vi.setSystemTime(new Date("2025-03-12T14:00:00.000Z"));
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

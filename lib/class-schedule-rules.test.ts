import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isClassEditableAt,
  assertClassEditable,
  getClassEditWindowEndMs,
  getClassStartInstantMs,
} from "./class-schedule-rules";

describe("isClassEditableAt", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_TIMEZONE", "America/Argentina/Buenos_Aires");
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("siempre true (sin tope de 24h desde el inicio)", () => {
    vi.setSystemTime(new Date("2025-03-12T15:01:00.000Z"));
    expect(isClassEditableAt("2025-03-11", "12:00")).toBe(true);
    expect(isClassEditableAt("2025-03-12", "10:00")).toBe(true);
  });
});

describe("assertClassEditable", () => {
  it("no lanza", () => {
    expect(() => assertClassEditable("2020-01-01", "00:00")).not.toThrow();
  });
});

describe("getClassEditWindowEndMs (helpers legacy)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_APP_TIMEZONE", "America/Argentina/Buenos_Aires");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sigue siendo inicio + 24h en ms (solo referencia numérica)", () => {
    const end = getClassEditWindowEndMs("2025-03-12", "10:00");
    expect(end).toBe(getClassStartInstantMs("2025-03-12", "10:00") + 24 * 60 * 60 * 1000);
  });
});

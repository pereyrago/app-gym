import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createClassSchema } from "./class";

const base = {
  class_type_id: "123e4567-e89b-12d3-a456-426614174000",
  class_date: "2025-07-15",
  start_time: "06:00",
  duration_minutes: 60,
};

describe("createClassSchema", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_APP_TIMEZONE", "America/Argentina/Buenos_Aires");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("rechaza día calendario anterior a hoy", () => {
    vi.setSystemTime(new Date("2025-07-15T15:00:00.000Z"));
    const r = createClassSchema.safeParse({ ...base, class_date: "2025-07-14" });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.flatten().fieldErrors.class_date?.length).toBeGreaterThan(0);
  });

  it("acepta hoy con hora anterior a la actual (misma regla: solo día)", () => {
    vi.setSystemTime(new Date("2025-07-15T15:00:00.000Z"));
    const r = createClassSchema.safeParse({ ...base, class_date: "2025-07-15", start_time: "08:00" });
    expect(r.success).toBe(true);
  });

  it("acepta hoy con hora futura", () => {
    vi.setSystemTime(new Date("2025-07-15T15:00:00.000Z"));
    const r = createClassSchema.safeParse({ ...base, class_date: "2025-07-15", start_time: "20:00" });
    expect(r.success).toBe(true);
  });

  it("acepta fecha futura", () => {
    vi.setSystemTime(new Date("2025-07-15T15:00:00.000Z"));
    const r = createClassSchema.safeParse({ ...base, class_date: "2025-07-20" });
    expect(r.success).toBe(true);
  });
});

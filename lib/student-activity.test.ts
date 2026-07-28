import { describe, it, expect } from "vitest";
import { classifyStudentActivity } from "./student-activity";

const REF = new Date("2026-07-20T00:00:00Z");

describe("classifyStudentActivity", () => {
  it("es 'active' si entrenó durante el período, sin importar la última asistencia", () => {
    expect(classifyStudentActivity(null, REF, true)).toBe("active");
    expect(classifyStudentActivity("2020-01-01", REF, true)).toBe("active");
  });

  it("es 'inactive' si nunca asistió y no entrenó en el período", () => {
    expect(classifyStudentActivity(null, REF, false)).toBe("inactive");
  });

  it("es 'active' con 0 a 14 días desde la última asistencia", () => {
    expect(classifyStudentActivity("2026-07-20", REF, false)).toBe("active"); // 0 días
    expect(classifyStudentActivity("2026-07-06", REF, false)).toBe("active"); // 14 días exactos
  });

  it("es 'at_risk' entre 15 y 30 días desde la última asistencia", () => {
    expect(classifyStudentActivity("2026-07-05", REF, false)).toBe("at_risk"); // 15 días
    expect(classifyStudentActivity("2026-06-20", REF, false)).toBe("at_risk"); // 30 días exactos
  });

  it("es 'inactive' con más de 30 días desde la última asistencia", () => {
    expect(classifyStudentActivity("2026-06-19", REF, false)).toBe("inactive"); // 31 días
  });
});

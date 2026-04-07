import { describe, it, expect } from "vitest";
import { classCanBeEdited, getClassEditabilityLabel } from "./class-utils";

describe("classCanBeEdited", () => {
  it("siempre permite edición (sin ventana de 24h)", () => {
    expect(classCanBeEdited("2020-01-01", "09:00")).toBe(true);
    expect(classCanBeEdited("2030-12-31", "23:59")).toBe(true);
  });
});

describe("getClassEditabilityLabel", () => {
  it("indica editable", () => {
    expect(getClassEditabilityLabel("2025-03-12", "10:00")).toBe("Editable");
  });
});

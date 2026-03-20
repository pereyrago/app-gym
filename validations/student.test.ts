import { describe, it, expect } from "vitest";
import { createStudentSchema } from "./student";

describe("createStudentSchema", () => {
  const base = {
    full_name: "Juan Pérez",
    dni: "",
    phone: "1122334455",
    apto_fisico: false,
  };

  it("acepta email y teléfono de emergencia null (como envía el cliente con || null)", () => {
    const r = createStudentSchema.safeParse({
      ...base,
      email: null,
      emergency_contact_phone: null,
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.email).toBe("");
      expect(r.data.emergency_contact_phone).toBe("");
    }
  });

  it("acepta email vacío y valida email cuando hay valor", () => {
    expect(createStudentSchema.safeParse({ ...base, email: "", emergency_contact_phone: "" }).success).toBe(
      true
    );
    const bad = createStudentSchema.safeParse({
      ...base,
      email: "no-es-email",
      emergency_contact_phone: "",
    });
    expect(bad.success).toBe(false);
  });
});

import { z } from "zod";

/** DNI con contenido: 7–12 caracteres, solo dígitos y separadores habituales. */
const dniWhenPresentSchema = z
  .string()
  .min(7, "DNI al menos 7 caracteres")
  .max(12, "DNI máximo 12 caracteres")
  .regex(/^[0-9.\s-]+$/, "DNI solo números (puntos o guiones permitidos)");

/** Vacío u omitido = sin DNI; si se completa, debe cumplir el formato. */
const dniOptionalSchema = z.union([z.literal(""), dniWhenPresentSchema]);

export const createStudentSchema = z.object({
  full_name: z.string().min(1, "Nombre requerido"),
  dni: dniOptionalSchema,
  email: z.union([z.literal(""), z.string().email("Email inválido")]),
  phone: z.string().min(1, "Teléfono requerido").max(30, "Máximo 30 caracteres"),
  emergency_contact_phone: z.string().max(30, "Máximo 30 caracteres").optional().or(z.literal("")),
  apto_fisico: z.boolean().optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

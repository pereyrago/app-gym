import { z } from "zod";

const dniSchema = z
  .string()
  .min(7, "DNI al menos 7 caracteres")
  .max(12, "DNI máximo 12 caracteres")
  .regex(/^[0-9.\s-]+$/, "DNI solo números (puntos o guiones permitidos)");

export const createStudentSchema = z.object({
  full_name: z.string().min(1, "Nombre requerido"),
  dni: dniSchema,
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().max(30, "Máximo 30 caracteres").optional().or(z.literal("")),
  emergency_contact_phone: z.string().max(30, "Máximo 30 caracteres").optional().or(z.literal("")),
  apto_fisico: z.boolean().optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

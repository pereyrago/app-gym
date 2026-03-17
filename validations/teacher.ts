import { z } from "zod";

export const createTeacherSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  full_name: z.string().min(1, "Nombre requerido"),
  dni: z.string().max(20).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

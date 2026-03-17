import { z } from "zod";

const periodBaseSchema = z.object({
  name: z.string().min(1, "Nombre del período requerido"),
  start_date: z.string().min(1, "Fecha inicio requerida"),
  end_date: z.string().min(1, "Fecha fin requerida"),
});

export const createPeriodSchema = periodBaseSchema.refine(
  (data) => new Date(data.end_date) >= new Date(data.start_date),
  { message: "La fecha fin debe ser mayor o igual a la fecha inicio", path: ["end_date"] }
);

export const updatePeriodSchema = periodBaseSchema.partial();

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>;

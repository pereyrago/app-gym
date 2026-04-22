import { z } from "zod";

const DURATION_OPTIONS = [60, 90] as const;

const createClassBaseSchema = z.object({
  class_type_id: z.string().uuid("Seleccione un tipo de clase"),
  class_date: z.string().min(1, "Fecha requerida"),
  start_time: z.string().min(1, "Hora requerida"),
  duration_minutes: z
    .number()
    .min(1, "Duración requerida")
    .refine((n) => (DURATION_OPTIONS as readonly number[]).includes(n), "Duración no válida"),
});

/** Esquema para creación individual. */
export const createClassSchema = createClassBaseSchema;

/** Esquema para creación múltiple (bulk). */
export const createMultipleClassesSchema = createClassBaseSchema
  .omit({ class_date: true })
  .extend({
    class_dates: z.array(z.string().min(1)).min(1, "Seleccione al menos una fecha"),
  });

const statusOptions = ["success", "cancel_by_student", "cancel_by_teacher"] as const;

export const updateClassSchema = createClassBaseSchema
  .partial()
  .extend({
    status: z.enum(statusOptions).optional(),
    cancellation_reason: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === "success" || data.status == null) return true;
      return data.cancellation_reason != null && String(data.cancellation_reason).trim().length > 0;
    },
    {
      message: "El motivo es obligatorio cuando la clase se cancela.",
      path: ["cancellation_reason"],
    }
  );

export type CreateClassInput = z.infer<typeof createClassSchema>;
export type CreateMultipleClassesInput = z.infer<typeof createMultipleClassesSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;

export const DURATION_MINUTES_OPTIONS = DURATION_OPTIONS;

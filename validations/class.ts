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

export const createClassSchema = createClassBaseSchema.refine(
  (data) => {
    const timeStr = String(data.start_time).slice(0, 5);
    const classStart = new Date(`${data.class_date}T${timeStr}:00`);
    return classStart.getTime() >= Date.now();
  },
  { message: "La fecha y hora no pueden ser anteriores al momento actual.", path: ["class_date"] }
);

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
export type UpdateClassInput = z.infer<typeof updateClassSchema>;

export const DURATION_MINUTES_OPTIONS = DURATION_OPTIONS;

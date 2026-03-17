import { z } from "zod";

export const createClassTypeSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100, "Nombre demasiado largo"),
});

export type CreateClassTypeInput = z.infer<typeof createClassTypeSchema>;

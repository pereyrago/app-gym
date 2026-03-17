import { z } from "zod";

export const setAttendancesSchema = z.object({
  class_id: z.string().uuid(),
  student_ids: z.array(z.string().uuid()),
});

export type SetAttendancesInput = z.infer<typeof setAttendancesSchema>;

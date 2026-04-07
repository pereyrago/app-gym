import { z } from "zod";

export const teacherStudentGroupSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  student_ids: z.array(z.string().uuid()),
});

export type TeacherStudentGroupInput = z.infer<typeof teacherStudentGroupSchema>;

export const teacherStudentGroupUpdateSchema = teacherStudentGroupSchema.extend({
  id: z.string().uuid(),
});

export type TeacherStudentGroupUpdateInput = z.infer<typeof teacherStudentGroupUpdateSchema>;

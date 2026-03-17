import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Teacher = Database["public"]["Tables"]["teachers"]["Row"];
export type Period = Database["public"]["Tables"]["periods"]["Row"];
export type Student = Database["public"]["Tables"]["students"]["Row"];
export type ClassType = Database["public"]["Tables"]["class_types"]["Row"];
export type Class = Database["public"]["Tables"]["classes"]["Row"];
export type ClassAttendance = Database["public"]["Tables"]["class_attendances"]["Row"];

export type AppRole = Database["public"]["Tables"]["profiles"]["Row"]["role"];

export interface TeacherWithProfile extends Teacher {
  profiles: Pick<Profile, "email" | "full_name" | "role"> | null;
}

/** Clase con nombre del tipo (para listados). */
export interface ClassWithType extends Class {
  class_types: { name: string } | null;
}

export interface ClassWithDetails extends Class {
  class_types?: { name: string } | null;
  class_attendances?: Array<{
    id: string;
    student_id: string;
    students?: { full_name: string; email: string | null; status?: string } | null;
  }>;
}

export interface PeriodWithDates extends Period {
  start_date: string;
  end_date: string;
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = "admin" | "profesor";

/** Estado de la clase: realizada o cancelada por alumno/profesor */
export type ClassStatus = "success" | "cancel_by_student" | "cancel_by_teacher";

/** Alcance: clase individual (1:1) o compartida */
export type ClassScope = "individual" | "shared";

/** Tipo de motivo de cancelación */
export type CancellationReasonType = "viaje" | "enfermedad" | "trabajo" | "sin_aviso" | "otro";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: AppRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
      };
      teachers: {
        Row: {
          id: string;
          profile_id: string;
          public_slug: string;
          dni: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          public_slug: string;
          dni?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          public_slug?: string;
          dni?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      periods: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_date: string;
          end_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          start_date?: string;
          end_date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          teacher_id: string;
          full_name: string;
          email: string | null;
          dni: string | null;
          phone: string | null;
          emergency_contact_phone: string | null;
          apto_fisico: boolean | null;
          status: "active" | "to_confirm" | "rejected";
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          full_name: string;
          email?: string | null;
          dni?: string | null;
          phone?: string | null;
          emergency_contact_phone?: string | null;
          apto_fisico?: boolean | null;
          status?: "active" | "to_confirm" | "rejected";
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          full_name?: string;
          email?: string | null;
          dni?: string | null;
          phone?: string | null;
          emergency_contact_phone?: string | null;
          apto_fisico?: boolean | null;
          status?: "active" | "to_confirm" | "rejected";
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      class_types: {
        Row: { id: string; name: string; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; created_at?: string; updated_at?: string };
      };
      classes: {
        Row: {
          id: string;
          teacher_id: string;
          period_id: string;
          class_type_id: string;
          class_date: string;
          start_time: string;
          duration_minutes: number;
          status: ClassStatus;
          cancellation_reason: string | null;
          cancellation_reason_type: string | null;
          cancellation_reason_other: string | null;
          cancellation_reason_observations: string | null;
          scope: ClassScope;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          period_id: string;
          class_type_id: string;
          class_date: string;
          start_time: string;
          duration_minutes: number;
          status?: ClassStatus;
          cancellation_reason?: string | null;
          cancellation_reason_type?: string | null;
          cancellation_reason_other?: string | null;
          cancellation_reason_observations?: string | null;
          scope?: ClassScope;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          period_id?: string;
          class_type_id?: string;
          class_date?: string;
          start_time?: string;
          duration_minutes?: number;
          status?: ClassStatus;
          cancellation_reason?: string | null;
          cancellation_reason_type?: string | null;
          cancellation_reason_other?: string | null;
          cancellation_reason_observations?: string | null;
          scope?: ClassScope;
          created_at?: string;
          updated_at?: string;
        };
      };
      class_attendances: {
        Row: { id: string; class_id: string; student_id: string; created_at: string };
        Insert: { id?: string; class_id: string; student_id: string; created_at?: string };
        Update: { id?: string; class_id?: string; student_id?: string; created_at?: string };
      };
      class_absences: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          reason_type: string;
          reason_other: string | null;
          observations: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
          reason_type: string;
          reason_other?: string | null;
          observations?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          student_id?: string;
          reason_type?: string;
          reason_other?: string | null;
          observations?: string | null;
          created_at?: string;
        };
      };
      teacher_student_groups: {
        Row: {
          id: string;
          teacher_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      teacher_student_group_members: {
        Row: {
          id: string;
          group_id: string;
          student_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          student_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          student_id?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_role: { Returns: AppRole };
      is_admin: { Returns: boolean };
      get_my_teacher_id: { Returns: string | null };
      class_can_edit: {
        Args: { p_class_date: string; p_start_time: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

import { randomBytes } from "crypto";
import { getSupabaseAuthAdminClient } from "@/lib/supabase/admin";
import { createTeacherSchema } from "@/validations/teacher";

function generatePublicSlug(): string {
  return randomBytes(5).toString("base64url").slice(0, 8);
}

export async function createTeacher(input: unknown) {
  const parsed = createTeacherSchema.parse(input);

  if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Falta SUPABASE_SECRET_KEY en .env.local (solo para crear profesores vía Auth Admin)."
    );
  }

  const supabase = getSupabaseAuthAdminClient();

  const {
    data: { user },
    error: signUpError,
  } = await supabase.auth.admin.createUser({
    email: parsed.email,
    password: parsed.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.full_name, role: "profesor" },
  });

  if (signUpError || !user) {
    throw new Error(signUpError?.message ?? "Error al crear usuario");
  }

  // Asegurar que exista el perfil (por si el trigger no corrió o tarda)
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: parsed.email,
      full_name: parsed.full_name,
      role: "profesor",
    } as never,
    { onConflict: "id" }
  );

  const public_slug = generatePublicSlug();
  const dni = parsed.dni?.trim() || null;
  const phone = parsed.phone?.trim() || null;
  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .insert({ profile_id: user.id, public_slug, dni, phone } as never)
    .select()
    .single();

  if (teacherError) {
    throw new Error(
      teacherError.message.includes("foreign key")
        ? "No se pudo crear el profesor (perfil o tablas). ¿Ejecutaste run-all-migrations.sql en Supabase?"
        : teacherError.message
    );
  }
  return teacher;
}

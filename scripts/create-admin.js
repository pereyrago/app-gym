/**
 * Crea un usuario admin en Supabase Auth.
 * Uso: node scripts/create-admin.js
 * Requiere SUPABASE_SECRET_KEY (o SUPABASE_SERVICE_ROLE_KEY) en .env.local para Auth Admin.
 */

const fs = require("fs");
const path = require("path");

// Cargar .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!url || !secretKey) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SECRET_KEY en .env.local");
  console.error("Supabase Dashboard → Settings → API → Secret (service_role) key");
  process.exit(1);
}

if (!adminEmail || !adminPassword) {
  console.error("Falta ADMIN_EMAIL o ADMIN_PASSWORD en .env.local");
  console.error("Añade las variables y vuelve a ejecutar: node scripts/create-admin.js");
  process.exit(1);
}

async function main() {
  const { createClient } = await import("@supabase/supabase-js");

  const supabase = createClient(url, secretKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { role: "admin" },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log("El usuario ya existe. Actualizando perfil a admin...");
      const { data: users } = await supabase.auth.admin.listUsers();
      const user = users?.users?.find((u) => u.email === adminEmail);
      if (user) {
        const { error: updError } = await supabase
          .from("profiles")
          .update({ role: "admin" })
          .eq("id", user.id);
        if (updError) {
          console.error("Error actualizando perfil:", updError.message);
          process.exit(1);
        }
        console.log("Perfil actualizado a admin. Listo.");
        return;
      }
    }
    console.error("Error:", error.message);
    process.exit(1);
  }

  console.log("Admin creado:", data.user?.email ?? adminEmail);
}

main();

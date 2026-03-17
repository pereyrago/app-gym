import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

async function signOutAction() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function SinPerfilPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Perfil no encontrado</CardTitle>
          <CardDescription>
            Tu usuario existe pero no hay un perfil en la base de datos. Suele pasar si no se
            ejecutaron las migraciones de Supabase o el usuario se creó antes del trigger.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Opciones: ejecuta las migraciones en Supabase (SQL Editor) o pide al administrador que
            añada tu perfil. Si ya las ejecutaste, cierra sesión y vuelve a entrar.
          </p>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </form>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/">Ir al inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

import { redirect } from "next/navigation";
import { getProfile, ensureProfile } from "@/lib/auth";
import { AdminNav } from "@/features/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let profile = await getProfile();
  if (!profile) profile = await ensureProfile();
  if (!profile) redirect("/auth/sin-perfil");
  if (profile.role !== "admin") redirect("/teacher");

  return (
    <div className="flex h-screen min-h-[100dvh] flex-col md:flex-row overflow-hidden bg-background">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      <AdminNav />
      <main
        id="main-content"
        className="flex-1 overflow-y-auto scrollbar-thin bg-background focus:outline-none"
        tabIndex={-1}
      >
        <div className="mx-auto w-full max-w-5xl p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

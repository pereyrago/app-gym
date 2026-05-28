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
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      <AdminNav />
      <main
        id="main-content"
        className="flex-1 overflow-auto p-3 md:p-4 scrollbar-thin"
        tabIndex={-1}
      >
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
    </div>
  );
}

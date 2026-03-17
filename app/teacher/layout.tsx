import { redirect } from "next/navigation";
import { getProfile, ensureProfile } from "@/lib/auth";
import { TeacherNav } from "@/features/teacher/teacher-nav";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  let profile = await getProfile();
  if (!profile) profile = await ensureProfile();
  if (!profile) redirect("/auth/sin-perfil");
  if (profile.role !== "profesor") redirect("/admin");

  return (
    <div className="flex min-h-screen flex-col">
      <TeacherNav />
      <main className="flex-1 overflow-auto p-3 md:p-4 scrollbar-thin">
        <div className="mx-auto w-full max-w-2xl">{children}</div>
      </main>
    </div>
  );
}

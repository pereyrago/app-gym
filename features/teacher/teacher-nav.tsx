"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/teacher/classes", label: "Clases" },
  { href: "/teacher/students", label: "Alumnos" },
  { href: "/teacher/student-groups", label: "Grupos" },
] as const;

export function TeacherNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-12 w-full max-w-3xl items-center justify-between px-3">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/classes"
            className="flex items-center gap-2 rounded py-1 pr-2 text-[13px] font-bold tracking-wide"
            aria-label="SYR Entrenamientos"
          >
            <Image src="/logo.svg" alt="" width={24} height={24} className="h-6 w-6 shrink-0" />
            <span className="hidden sm:inline-block">SYR</span>
          </Link>

          <nav className="flex items-center gap-1" aria-label="Principal">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded text-muted-foreground hover:text-foreground"
          aria-label="Cerrar sesión"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

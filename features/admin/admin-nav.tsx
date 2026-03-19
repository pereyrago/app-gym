"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/admin";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background">
      <div className="mx-auto flex h-12 w-full max-w-5xl items-center justify-between px-3">
        <nav className="flex items-center gap-2 md:gap-3" aria-label="Principal">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2 rounded px-3 py-1.5 text-[13px] font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              isHome ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
            aria-label="App Gym - Inicio"
          >
            <Image src="/logo.svg" alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
            <span>Inicio</span>
          </Link>
        </nav>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded"
          aria-label="Cerrar sesión"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

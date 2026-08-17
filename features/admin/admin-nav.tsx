"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  CalendarDays,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/teachers", label: "Profesores", icon: GraduationCap },
  { href: "/admin/students", label: "Alumnos", icon: Users },
  { href: "/admin/periods", label: "Períodos", icon: CalendarDays },
  { href: "/admin/reports", label: "Reportes", icon: FileText },
] as const;

const BOTTOM_ITEMS = [
  { href: "/admin/class-types", label: "Tipos de clase", icon: Settings },
] as const;

type NavItemProps = {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
};

function NavItem({ href, label, icon: Icon, active, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
        active
          ? "bg-secondary text-secondary-foreground font-semibold shadow-sm"
          : "text-slate-300 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

type NavContentProps = {
  onItemClick?: () => void;
  pathname: string;
  handleSignOut: () => Promise<void>;
};

function NavContent({ onItemClick, pathname, handleSignOut }: NavContentProps) {
  return (
    <div className="flex h-full w-full flex-col bg-[hsl(222,47%,8%)] text-white">
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 py-4">
        <Image
          src="/logo.svg"
          alt="SYR Entrenamientos"
          width={32}
          height={32}
          className="h-8 w-8 shrink-0"
        />
        <div className="leading-tight">
          <p className="text-base font-bold tracking-wide text-white">SYR</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Entrenamientos
          </p>
        </div>
      </div>

      <div className="mx-3 mb-2 h-px bg-white/10" />

      {/* Main nav */}
      <nav
        className="flex-1 space-y-1 overflow-y-auto px-3 py-2 scrollbar-thin"
        aria-label="Secciones"
      >
        {NAV_ITEMS.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href || pathname.startsWith(href + "/")}
            onClick={onItemClick}
          />
        ))}
      </nav>

      <div className="mx-3 mt-1 h-px bg-white/10" />

      {/* Bottom items */}
      <div className="space-y-1 px-3 py-2">
        {BOTTOM_ITEMS.map(({ href, label, icon }) => (
          <NavItem
            key={href}
            href={href}
            label={label}
            icon={icon}
            active={pathname === href || pathname.startsWith(href + "/")}
            onClick={onItemClick}
          />
        ))}

        {/* Ayuda — placeholder */}
        <div
          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400/60 cursor-not-allowed select-none"
          title="Próximamente"
          aria-disabled="true"
        >
          <HelpCircle className="h-4 w-4 shrink-0 text-slate-400/60" aria-hidden />
          <span>Ayuda</span>
        </div>
      </div>

      {/* Sign out */}
      <div className="mx-3 h-px bg-white/10" />
      <div className="px-3 py-3">
        <button
          type="button"
          onClick={() => {
            onItemClick?.();
            handleSignOut();
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-red-500/15 hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          <span>Salir</span>
        </button>
      </div>
    </div>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-close sheet on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  // Active item title for mobile header
  const activeItem =
    NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(item.href + "/")) ||
    BOTTOM_ITEMS.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"));

  return (
    <>
      {/* Mobile Top Header */}
      <header className="flex h-14 w-full items-center justify-between border-b border-white/10 bg-[hsl(222,47%,8%)] px-4 text-white shrink-0 md:hidden">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="SYR Entrenamientos"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0"
          />
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-bold tracking-wide text-white">SYR</span>
            <span className="text-xs text-slate-400 font-medium">|</span>
            <span className="text-xs font-semibold text-slate-300">
              {activeItem?.label || "Admin"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-300 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          aria-label="Abrir menú de navegación"
          aria-expanded={isOpen}
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      </header>

      {/* Mobile Navigation Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side="left"
          className="w-[280px] sm:w-[300px] p-0 bg-[hsl(222,47%,8%)] border-r border-white/10 text-white"
        >
          <SheetTitle className="sr-only">Navegación Admin</SheetTitle>
          <SheetDescription className="sr-only">
            Menú de navegación para el panel de administración
          </SheetDescription>
          <NavContent
            pathname={pathname}
            handleSignOut={handleSignOut}
            onItemClick={() => setIsOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation Sidebar */}
      <aside
        className="hidden md:flex h-full w-[220px] shrink-0 flex-col bg-[hsl(222,47%,8%)] border-r border-white/10"
        aria-label="Navegación principal"
      >
        <NavContent pathname={pathname} handleSignOut={handleSignOut} />
      </aside>
    </>
  );
}

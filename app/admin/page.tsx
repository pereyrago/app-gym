import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Calendar, Layers, FileText } from "lucide-react";

const iconCards = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/teachers", label: "Profesores", icon: Users },
  { href: "/admin/periods", label: "Períodos", icon: Calendar },
  { href: "/admin/class-types", label: "Tipos de clase", icon: Layers },
  { href: "/admin/reports", label: "Informes", icon: FileText },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-lg font-semibold tracking-tight">Panel de administración</h1>
        <p className="text-[13px] text-muted-foreground">Acceso rápido por sección.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {iconCards.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="group block">
            <Card className="border border-border/80 shadow-none transition-colors duration-200">
              <CardHeader className="flex flex-col items-center justify-center space-y-2 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted transition-colors duration-200 group-hover:bg-secondary">
                  <Icon
                    className="h-6 w-6 text-secondary transition-colors duration-200 group-hover:text-secondary-foreground"
                    aria-hidden
                  />
                </div>
                <CardTitle className="text-center text-[13px] font-medium">{label}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

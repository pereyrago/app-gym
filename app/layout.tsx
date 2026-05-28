import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "App Gym - Gestión de horas de clases",
  description: "Sistema de gestión de clases y asistencias",
  icons: { icon: "/logo.svg", apple: "/logo.svg" },
  themeColor: "#020817",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-background text-foreground min-h-screen"
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

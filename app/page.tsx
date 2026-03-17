import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background p-6">
      <Image
        src="/full_logo.svg"
        alt="App Gym"
        width={260}
        height={78}
        className="h-auto w-full max-w-[260px] shrink-0"
        priority
      />
      <nav className="flex gap-4">
        <Button variant="secondary" size="lg" asChild>
          <Link href="/login">Iniciar sesión</Link>
        </Button>
      </nav>
    </main>
  );
}

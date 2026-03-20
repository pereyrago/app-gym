"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Captura errores de render en rutas /admin/*.
 * En producción Next oculta el mensaje; el digest sirve para correlacionar con logs del servidor.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin error]", error.message, error.digest, error);
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="mx-auto max-w-md space-y-4 py-8">
      <h2 className="text-lg font-semibold">Error en el panel de administración</h2>
      <p className="text-sm text-muted-foreground">
        {isDev
          ? error.message
          : "Ocurrió un error al cargar esta página. Podés reintentar o volver al inicio."}
      </p>
      {!isDev && error.digest ? (
        <p className="font-mono text-[11px] text-muted-foreground">
          Referencia: {error.digest}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => reset()}>
          Reintentar
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin">Ir al inicio admin</Link>
        </Button>
      </div>
    </div>
  );
}

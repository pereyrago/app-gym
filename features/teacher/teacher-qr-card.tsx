"use client";

import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

const WHATSAPP_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const FULL_SIZE = 400;

interface TeacherQRCardProps {
  slug: string;
}

export function TeacherQRCard({ slug }: TeacherQRCardProps) {
  const [url, setUrl] = useState("");
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/p/${slug}`);
  }, [slug]);

  function openQrInNewTab() {
    if (!url || opening) return;
    setOpening(true);
    const tempDiv = document.createElement("div");
    tempDiv.style.cssText =
      "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;";
    document.body.appendChild(tempDiv);
    const root = createRoot(tempDiv);
    root.render(<QRCodeSVG value={url} size={FULL_SIZE} level="M" includeMargin />);
    const cleanup = () => {
      root.unmount();
      if (tempDiv.parentNode) document.body.removeChild(tempDiv);
      setOpening(false);
    };
    const getSvg = () => tempDiv.querySelector("svg");
    const tryOpen = (retries = 0) => {
      const svg = getSvg();
      if (!svg) {
        if (retries < 20) setTimeout(() => tryOpen(retries + 1), 50);
        else cleanup();
        return;
      }
      try {
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        canvas.width = FULL_SIZE;
        canvas.height = FULL_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          return;
        }
        const img = new Image();
        const blob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        });
        const blobUrl = URL.createObjectURL(blob);
        img.onload = () => {
          ctx.drawImage(img, 0, 0, FULL_SIZE, FULL_SIZE);
          URL.revokeObjectURL(blobUrl);
          canvas.toBlob((blob) => {
            if (!blob) {
              cleanup();
              return;
            }
            const imageUrl = URL.createObjectURL(blob);
            window.open(imageUrl, "_blank", "noopener,noreferrer");
            setTimeout(() => URL.revokeObjectURL(imageUrl), 10000);
            cleanup();
          }, "image/png");
        };
        img.src = blobUrl;
      } catch {
        cleanup();
      }
    };
    setTimeout(() => tryOpen(0), 100);
  }

  const whatsappShareUrl = url
    ? "https://api.whatsapp.com/send?text=" + encodeURIComponent(`${url}\n\nSumate a mi clase`)
    : "#";

  if (!slug) return null;

  return (
    <div className="flex shrink-0 items-center gap-4">
      <button
        type="button"
        onClick={openQrInNewTab}
        disabled={!url || opening}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md bg-muted/60 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="Abrir QR en nueva pestaña"
      >
        {url ? (
          <QrCode className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
        ) : (
          <div className="h-5 w-5 animate-pulse rounded-sm bg-muted-foreground/20" />
        )}
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-muted-foreground hover:text-[#25D366]"
        asChild
      >
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir por WhatsApp"
        >
          {WHATSAPP_ICON}
        </a>
      </Button>
    </div>
  );
}

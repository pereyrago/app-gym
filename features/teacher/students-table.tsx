"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, ArrowUpDown, Phone, Info } from "lucide-react";
import type { Student } from "@/types";
import type { StudentsSortBy, StudentsSortOrder } from "@/repositories/students";

const DEBOUNCE_MS = 400;

const WHATSAPP_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface StudentsTableProps {
  students: Student[];
  search: string;
  sortBy: StudentsSortBy;
  sortOrder: StudentsSortOrder;
}

/** Número solo dígitos; para wa.me se suele usar código país (ej. 54 Argentina). */
function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

function whatsappUrl(phone: string): string {
  const digits = digitsOnly(phone);
  const withCountry = digits.length <= 10 ? "54" + digits : digits;
  return `https://wa.me/${withCountry}`;
}

function PhoneRow({ label, value }: { label: string; value: string | null }) {
  if (!value || !value.trim()) {
    return (
      <div>
        <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
        <p className="text-sm">—</p>
      </div>
    );
  }
  const telHref = "tel:" + value.trim().replace(/\s/g, "");
  const waHref = whatsappUrl(value);
  return (
    <div>
      <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <span className="text-sm">{value.trim()}</span>
        <span className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={telHref} aria-label="Llamar" title="Llamar">
              <Phone className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#25D366] hover:text-[#25D366]"
            asChild
          >
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              title="WhatsApp"
            >
              {WHATSAPP_ICON}
            </a>
          </Button>
        </span>
      </div>
    </div>
  );
}

function buildSearchParams(
  search: string,
  sortBy: StudentsSortBy,
  sortOrder: StudentsSortOrder
): string {
  const p = new URLSearchParams();
  if (search) p.set("search", search);
  p.set("sortBy", sortBy);
  p.set("sortOrder", sortOrder);
  return p.toString();
}

export function StudentsTable({
  students,
  search: searchFromUrl,
  sortBy,
  sortOrder,
}: StudentsTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [searchInput, setSearchInput] = useState(searchFromUrl);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    if (searchInput.trim() === searchFromUrl) return;
    const t = window.setTimeout(() => {
      const q = searchInput.trim();
      const query = buildSearchParams(q, sortBy, sortOrder);
      router.replace(`${pathname}${query ? `?${query}` : ""}`);
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput, pathname, sortBy, sortOrder, router, searchFromUrl]);

  const goToSort = useCallback(
    (newSortBy: StudentsSortBy) => {
      const newOrder: StudentsSortOrder =
        sortBy === newSortBy ? (sortOrder === "asc" ? "desc" : "asc") : "asc";
      const query = buildSearchParams(searchInput.trim(), newSortBy, newOrder);
      router.replace(`${pathname}?${query}`);
    },
    [sortBy, sortOrder, searchInput, pathname, router]
  );

  const isEmpty = students.length === 0;
  const hasSearch = searchFromUrl.trim().length > 0;

  if (isEmpty && !hasSearch) {
    return (
      <div className="rounded border border-border/80 p-6 text-center text-[13px] text-muted-foreground">
        No hay alumnos. Crea uno desde el botón superior o pide que escaneen tu QR.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nombre o teléfono..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-full min-w-0 pl-10 pr-3"
            aria-label="Buscar alumnos"
          />
        </div>
        {!isEmpty && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <div className="flex items-center gap-1">
                    <span>Nombre</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => goToSort("full_name")}
                      aria-label={
                        sortBy === "full_name"
                          ? sortOrder === "asc"
                            ? "Ordenar Z–A"
                            : "Ordenar A–Z"
                          : "Ordenar por nombre"
                      }
                      title={
                        sortBy === "full_name"
                          ? sortOrder === "asc"
                            ? "Ordenar Z–A"
                            : "Ordenar A–Z"
                          : "Ordenar por nombre"
                      }
                    >
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>Estado</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => goToSort("status")}
                      aria-label={
                        sortBy === "status"
                          ? sortOrder === "asc"
                            ? "Ordenar estado desc"
                            : "Ordenar estado asc"
                          : "Ordenar por estado"
                      }
                      title={
                        sortBy === "status"
                          ? sortOrder === "asc"
                            ? "Ordenar estado desc"
                            : "Ordenar estado asc"
                          : "Ordenar por estado"
                      }
                    >
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => {
                const pending = s.status === "to_confirm";
                return (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/teacher/students/${s.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/teacher/students/${s.id}`);
                      }
                    }}
                  >
                    <TableCell className="font-medium capitalize">{s.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.phone ?? "—"}</TableCell>
                    <TableCell className="text-center">
                      {pending ? (
                        <span className="flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground">
                          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          Pendiente
                        </span>
                      ) : (
                        <span className="text-[12px] text-muted-foreground">Activo</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {isEmpty && hasSearch && (
          <p className="py-4 text-center text-[13px] text-muted-foreground">
            No hay resultados para &quot;{searchFromUrl}&quot;
          </p>
        )}
      </div>
    </>
  );
}

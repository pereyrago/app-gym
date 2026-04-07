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
import { digitsOnly, whatsappUrl } from "@/lib/whatsapp-url";
import { WhatsAppBrandIcon } from "@/components/icons/whatsapp-brand-icon";

const DEBOUNCE_MS = 400;

interface StudentsTableProps {
  students: Student[];
  search: string;
  sortBy: StudentsSortBy;
  sortOrder: StudentsSortOrder;
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
              <WhatsAppBrandIcon />
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AdminStudentListRow } from "@/repositories/admin-students";
import { whatsappUrl } from "@/lib/whatsapp-url";
import { ExternalLink, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { DeleteStudentButton } from "./delete-student-button";

const WHATSAPP_ICON = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

function formatDt(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return format(parseISO(iso), "d MMM yyyy, HH:mm", { locale: es });
  } catch {
    return iso;
  }
}

function DetailLine({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="border-b border-border/60 py-2 last:border-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm break-words">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

interface AdminStudentsTableProps {
  students: AdminStudentListRow[];
}

export function AdminStudentsTable({ students }: AdminStudentsTableProps) {
  const [detail, setDetail] = useState<AdminStudentListRow | null>(null);

  if (students.length === 0) {
    return (
      <div className="rounded border border-border/80 p-6 text-center text-[13px] text-muted-foreground">
        No hay alumnos registrados.
      </div>
    );
  }

  const teacherAddedLabel = (s: AdminStudentListRow) =>
    s.teacher_profile_full_name?.trim() ||
    s.teacher_profile_email?.trim() ||
    "—";

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-border/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alumno</TableHead>
              <TableHead className="w-[52px] text-center">WhatsApp</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-[70px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow
                key={s.id}
                className="cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => setDetail(s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setDetail(s);
                  }
                }}
              >
                <TableCell className="font-medium capitalize">{s.full_name}</TableCell>
                <TableCell className="text-center">
                  {s.phone?.trim() ? (
                    <a
                      href={whatsappUrl(s.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md p-2 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                      title="Abrir WhatsApp"
                      aria-label={`WhatsApp ${s.full_name}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {WHATSAPP_ICON}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-[13px]">{s.email ?? "—"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded"
                        aria-label="Abrir menú"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/students/${s.id}/classes`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver clases
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <DeleteStudentButton studentId={s.id} />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={detail != null} onOpenChange={(open) => !open && setDetail(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          {detail ? (
            <>
              <SheetHeader className="text-left">
                <SheetTitle className="capitalize">{detail.full_name}</SheetTitle>
                <SheetDescription>Datos del registro y profesor titular.</SheetDescription>
              </SheetHeader>
              <dl className="mt-6 space-y-0 px-1">
                <DetailLine
                  label="Profesor que lo sumó"
                  value={teacherAddedLabel(detail)}
                />
                <DetailLine label="Email del profesor" value={detail.teacher_profile_email} />
                <DetailLine label="Fecha de creación del registro" value={formatDt(detail.created_at)} />
                <DetailLine label="Última actualización" value={formatDt(detail.updated_at)} />
                <DetailLine label="ID alumno" value={detail.id} />
                <DetailLine label="ID profesor (titular)" value={detail.teacher_id} />
                <DetailLine label="Estado" value={detail.status} />
                <DetailLine label="DNI" value={detail.dni} />
                <DetailLine label="Email" value={detail.email} />
                <DetailLine label="Teléfono" value={detail.phone} />
                <DetailLine label="Tel. emergencia" value={detail.emergency_contact_phone} />
                <DetailLine
                  label="Apto físico"
                  value={
                    detail.apto_fisico === null ? null : detail.apto_fisico ? "Sí" : "No"
                  }
                />
              </dl>
              <div className="mt-6 flex flex-col gap-2">
                {detail.phone?.trim() ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={whatsappUrl(detail.phone)} target="_blank" rel="noopener noreferrer">
                      <span className="mr-2 inline-flex">{WHATSAPP_ICON}</span>
                      Abrir WhatsApp
                      <ExternalLink className="ml-2 h-3.5 w-3.5 opacity-70" />
                    </a>
                  </Button>
                ) : null}
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/admin/students/${detail.id}/classes`}>Ver clases en las que participó</Link>
                </Button>
                <div className="mt-4 border-t border-border/60 pt-4">
                  <DeleteStudentButton studentId={detail.id} />
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

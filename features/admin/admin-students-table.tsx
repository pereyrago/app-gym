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
import { WhatsAppBrandIcon } from "@/components/icons/whatsapp-brand-icon";
import { ExternalLink, MoreHorizontal, Eye, Trash2 } from "lucide-react";
import { DeleteStudentButton } from "./delete-student-button";

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
    s.teacher_profile_full_name?.trim() || s.teacher_profile_email?.trim() || "—";

  return (
    <>
      <div className="overflow-x-auto rounded-md border border-border/80">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alumno</TableHead>
              <TableHead>Profesor</TableHead>
              <TableHead className="w-[52px] text-center">WhatsApp</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[70px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium capitalize">
                  <button
                    type="button"
                    className="text-left hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                    onClick={() => setDetail(s)}
                  >
                    {s.full_name}
                  </button>
                </TableCell>
                <TableCell className="max-w-[220px] truncate text-[13px]">
                  {teacherAddedLabel(s)}
                </TableCell>
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
                      <WhatsAppBrandIcon />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-[13px]">{s.email ?? "—"}</TableCell>
                <TableCell className="max-w-[120px] truncate text-[13px]">{s.status ?? "—"}</TableCell>
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
                      <span className="mr-2 inline-flex">
                        <WhatsAppBrandIcon />
                      </span>
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

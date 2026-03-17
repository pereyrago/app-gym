"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2, KeyRound } from "lucide-react";
import type { TeacherWithProfile } from "@/types";
import { DeleteTeacherButton } from "./delete-teacher-button";
import { ResetTeacherPasswordDialog } from "./reset-teacher-password-dialog";

interface TeachersTableProps {
  teachers: TeacherWithProfile[];
}

export function TeachersTable({ teachers }: TeachersTableProps) {
  const [resetPasswordTeacher, setResetPasswordTeacher] = useState<TeacherWithProfile | null>(null);

  if (teachers.length === 0) {
    return (
      <div className="rounded border border-border/80 p-6 text-center text-[13px] text-muted-foreground">
        No hay profesores. Crea uno desde el botón superior.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="w-[70px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.map((teacher) => {
            const profile = teacher.profiles;
            const email = profile?.email ?? "";
            const fullName = profile?.full_name ?? "—";
            const role = profile?.role ?? "profesor";
            return (
              <TableRow key={teacher.id}>
                <TableCell className="font-medium capitalize">{fullName}</TableCell>
                <TableCell>{email}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{role}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded"
                        aria-label="Abrir menú"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/teachers/${teacher.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver clases
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setResetPasswordTeacher(teacher)}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Restablecer contraseña
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <DeleteTeacherButton teacherId={teacher.id} />
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {resetPasswordTeacher && (
        <ResetTeacherPasswordDialog
          open={!!resetPasswordTeacher}
          onOpenChange={(open) => !open && setResetPasswordTeacher(null)}
          profileId={resetPasswordTeacher.profile_id}
          teacherName={
            resetPasswordTeacher.profiles?.full_name ??
            resetPasswordTeacher.profiles?.email ??
            "Profesor"
          }
        />
      )}
    </>
  );
}

import Link from "next/link";
import { getClassTypes } from "@/repositories/class-types";
import { ClassTypesTable } from "@/features/admin/class-types-table";
import { CreateClassTypeDialog } from "@/features/admin/create-class-type-dialog";
import { ChevronLeft } from "lucide-react";

export default async function AdminClassTypesPage() {
  const classTypes = await getClassTypes();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Breadcrumb">
          <Link
            href="/admin"
            className="inline-flex items-center text-[13px] text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-3.5 w-3.5" />
            Admin
          </Link>
        </nav>
        <h1 className="text-lg font-semibold tracking-tight">Tipos de clase</h1>
      </div>
      <p className="text-[13px] text-muted-foreground">
        Los tipos de clase los elige el profesor al crear una clase. Añade aquí las opciones
        disponibles (ej. Yoga, Pilates, Funcional).
      </p>
      <div className="flex justify-end">
        <CreateClassTypeDialog />
      </div>
      <ClassTypesTable classTypes={classTypes} />
    </div>
  );
}

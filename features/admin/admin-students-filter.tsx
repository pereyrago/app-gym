"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminStudentsFilterProps {
  options: Array<{ teacherId: string; teacherName: string }>;
  selectedTeacherId: string;
}

export function AdminStudentsFilter({
  options,
  selectedTeacherId,
}: AdminStudentsFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onTeacherChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("teacherId");
    } else {
      params.set("teacherId", value);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="w-full max-w-xs space-y-1">
      <Label htmlFor="admin-students-teacher-filter" className="text-[12px] text-muted-foreground">
        Profesor
      </Label>
      <Select value={selectedTeacherId || "all"} onValueChange={onTeacherChange}>
        <SelectTrigger id="admin-students-teacher-filter">
          <SelectValue placeholder="Seleccionar profesor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.teacherId} value={o.teacherId}>
              {o.teacherName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}


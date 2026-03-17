"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { DashboardFilters } from "@/features/dashboard/types";

type Period = { id: string; name: string };
type Teacher = { id: string; full_name: string | null };
type ClassType = { id: string; name: string };

type DashboardFiltersProps = {
  filters: DashboardFilters;
  periods: Period[];
  teachers: Teacher[];
  classTypes: ClassType[];
};

export function DashboardFiltersClient({
  filters,
  periods,
  teachers,
  classTypes,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`/admin/dashboard?${next.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <div className="space-y-2">
        <Label htmlFor="period" className="text-[13px]">
          Período
        </Label>
        <Select
          value={filters.periodId ?? "all"}
          onValueChange={(v) => setParam("period_id", v === "all" ? null : v)}
        >
          <SelectTrigger id="period" className="h-9">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {periods.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="date_from" className="text-[13px]">
          Desde
        </Label>
        <Input
          id="date_from"
          type="date"
          className="h-9"
          value={filters.dateFrom ?? ""}
          onChange={(e) => setParam("date_from", e.target.value || null)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="date_to" className="text-[13px]">
          Hasta
        </Label>
        <Input
          id="date_to"
          type="date"
          className="h-9"
          value={filters.dateTo ?? ""}
          onChange={(e) => setParam("date_to", e.target.value || null)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="teacher" className="text-[13px]">
          Profesor
        </Label>
        <Select
          value={filters.teacherId ?? "all"}
          onValueChange={(v) => setParam("teacher_id", v === "all" ? null : v)}
        >
          <SelectTrigger id="teacher" className="h-9">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {teachers.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.full_name || "Sin nombre"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="class_type" className="text-[13px]">
          Tipo de clase
        </Label>
        <Select
          value={filters.classTypeId ?? "all"}
          onValueChange={(v) => setParam("class_type_id", v === "all" ? null : v)}
        >
          <SelectTrigger id="class_type" className="h-9">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {classTypes.map((ct) => (
              <SelectItem key={ct.id} value={ct.id}>
                {ct.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

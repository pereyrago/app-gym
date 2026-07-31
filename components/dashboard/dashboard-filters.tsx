"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

type Teacher = { id: string; full_name: string | null };
type Student = { id: string; full_name: string | null };

type DashboardFiltersProps = {
  filters: DashboardFilters;
  teachers: Teacher[];
  students: Student[];
};

const DATE_PRESETS = [
  { id: "today", label: "Hoy" },
  { id: "week", label: "Esta semana" },
  { id: "month", label: "Este mes" },
  { id: "quarter", label: "Trimestre" },
  { id: "year", label: "Año" },
  { id: "custom", label: "Personalizado" },
] as const;

type DatePresetId = (typeof DATE_PRESETS)[number]["id"];

const CLASS_MODES = [
  { id: "individual", label: "Personalizado" },
  { id: "shared", label: "Grupal" },
] as const;

const DATE_DEBOUNCE_MS = 400;

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calcula { from, to } (YYYY-MM-DD) para un preset dado.
 * Todos los rangos van "a la fecha" (desde el inicio del período hasta hoy),
 * excepto "today" que es un único día.
 */
function computeRangeForPreset(preset: DatePresetId): { from: string; to: string } | null {
  if (preset === "custom") return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let from = today;

  switch (preset) {
    case "today": {
      from = today;
      break;
    }
    case "week": {
      const day = today.getDay(); // 0 = domingo, 1 = lunes, ...
      const diffToMonday = day === 0 ? 6 : day - 1;
      from = new Date(today);
      from.setDate(today.getDate() - diffToMonday);
      break;
    }
    case "month": {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    }
    case "quarter": {
      const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
      from = new Date(today.getFullYear(), quarterStartMonth, 1);
      break;
    }
    case "year": {
      from = new Date(today.getFullYear(), 0, 1);
      break;
    }
  }

  return {
    from: toDateInputValue(from),
    to: toDateInputValue(today),
  };
}

function resolveActivePreset(searchParams: URLSearchParams): DatePresetId {
  const explicit = searchParams.get("date_preset") as DatePresetId | null;
  if (explicit && DATE_PRESETS.some((p) => p.id === explicit)) return explicit;
  return "custom";
}

export function DashboardFiltersClient({ filters, teachers, students }: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activePreset = useMemo(() => resolveActivePreset(searchParams), [searchParams]);

  const [dateFromDraft, setDateFromDraft] = useState(filters.dateFrom ?? "");
  const [dateToDraft, setDateToDraft] = useState(filters.dateTo ?? "");
  const dateDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDateFromDraft(filters.dateFrom ?? "");
    setDateToDraft(filters.dateTo ?? "");
  }, [filters.dateFrom, filters.dateTo]);

  useEffect(() => {
    return () => {
      if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
    };
  }, []);

  const setParams = useCallback(
    (entries: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(entries)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      router.replace(`/admin/dashboard?${next.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const scheduleDateParams = useCallback(
    (nextFrom: string, nextTo: string) => {
      if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
      dateDebounceRef.current = setTimeout(() => {
        setParams({
          date_from: nextFrom || null,
          date_to: nextTo || null,
        });
      }, DATE_DEBOUNCE_MS);
    },
    [setParams]
  );

  const handlePresetChange = useCallback(
    (preset: DatePresetId) => {
      if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
      const range = computeRangeForPreset(preset);
      if (range) {
        setDateFromDraft(range.from);
        setDateToDraft(range.to);
        setParams({ date_preset: preset, date_from: range.from, date_to: range.to });
      } else {
        setParams({ date_preset: preset });
      }
    },
    [setParams]
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      <div className="space-y-2">
        <Label htmlFor="date_preset" className="text-[13px]">
          Periodo
        </Label>
        <Select value={activePreset} onValueChange={(v) => handlePresetChange(v as DatePresetId)}>
          <SelectTrigger id="date_preset" className="h-9">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            {DATE_PRESETS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activePreset === "custom" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="date_from" className="text-[13px]">
              Desde
            </Label>
            <Input
              id="date_from"
              type="date"
              className="h-9"
              value={dateFromDraft}
              onChange={(e) => {
                const value = e.target.value;
                setDateFromDraft(value);
                scheduleDateParams(value, dateToDraft);
              }}
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
              value={dateToDraft}
              onChange={(e) => {
                const value = e.target.value;
                setDateToDraft(value);
                scheduleDateParams(dateFromDraft, value);
              }}
            />
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="teacher" className="text-[13px]">
          Profesor
        </Label>
        <Select
          value={filters.teacherId ?? "all"}
          onValueChange={(v) => setParams({ teacher_id: v === "all" ? null : v })}
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
        <Label htmlFor="student" className="text-[13px]">
          Alumno
        </Label>
        <Select
          value={filters.studentId ?? "all"}
          onValueChange={(v) => setParams({ student_id: v === "all" ? null : v })}
        >
          <SelectTrigger id="student" className="h-9">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.full_name || "Sin nombre"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="class_mode" className="text-[13px]">
          Tipo de clase
        </Label>
        <Select
          value={filters.classMode ?? "all"}
          onValueChange={(v) => setParams({ class_mode: v === "all" ? null : v })}
        >
          <SelectTrigger id="class_mode" className="h-9">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {CLASS_MODES.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

  const hasActiveFilters =
    filters.teacherId !== null || filters.studentId !== null || filters.classMode !== null;

  function handleClear() {
    if (dateDebounceRef.current) clearTimeout(dateDebounceRef.current);
    router.replace("/admin/dashboard", { scroll: false });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/80 bg-card/50 p-2 sm:p-2.5">
      {/* Selector de período */}
      <Select value={activePreset} onValueChange={(v) => handlePresetChange(v as DatePresetId)}>
        <SelectTrigger
          id="date_preset"
          className="h-8 w-auto min-w-[130px] text-[13px]"
          aria-label="Período"
        >
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {DATE_PRESETS.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-[13px]">
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Inputs de fecha — solo en modo personalizado */}
      {activePreset === "custom" && (
        <div className="flex items-center gap-1.5">
          <Input
            id="date_from"
            type="date"
            className="h-8 w-[135px] text-[13px]"
            value={dateFromDraft}
            aria-label="Desde"
            onChange={(e) => {
              const value = e.target.value;
              setDateFromDraft(value);
              scheduleDateParams(value, dateToDraft);
            }}
          />
          <span className="text-[12px] text-muted-foreground" aria-hidden>
            –
          </span>
          <Input
            id="date_to"
            type="date"
            className="h-8 w-[135px] text-[13px]"
            value={dateToDraft}
            aria-label="Hasta"
            onChange={(e) => {
              const value = e.target.value;
              setDateToDraft(value);
              scheduleDateParams(dateFromDraft, value);
            }}
          />
        </div>
      )}

      {/* Profesor */}
      <Select
        value={filters.teacherId ?? "all"}
        onValueChange={(v) => setParams({ teacher_id: v === "all" ? null : v })}
      >
        <SelectTrigger
          id="teacher"
          className="h-8 w-auto min-w-[150px] text-[13px]"
          aria-label="Profesor"
        >
          <SelectValue placeholder="Todos los profesores" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-[13px]">
            Todos los profesores
          </SelectItem>
          {teachers.map((t) => (
            <SelectItem key={t.id} value={t.id} className="text-[13px]">
              {t.full_name || "Sin nombre"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Alumno */}
      <Select
        value={filters.studentId ?? "all"}
        onValueChange={(v) => setParams({ student_id: v === "all" ? null : v })}
      >
        <SelectTrigger
          id="student"
          className="h-8 w-auto min-w-[140px] text-[13px]"
          aria-label="Alumno"
        >
          <SelectValue placeholder="Todos los alumnos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-[13px]">
            Todos los alumnos
          </SelectItem>
          {students.map((s) => (
            <SelectItem key={s.id} value={s.id} className="text-[13px]">
              {s.full_name || "Sin nombre"}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Tipo de clase */}
      <Select
        value={filters.classMode ?? "all"}
        onValueChange={(v) => setParams({ class_mode: v === "all" ? null : v })}
      >
        <SelectTrigger
          id="class_mode"
          className="h-8 w-auto min-w-[130px] text-[13px]"
          aria-label="Tipo de clase"
        >
          <SelectValue placeholder="Todos los tipos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-[13px]">
            Todos los tipos
          </SelectItem>
          {CLASS_MODES.map((c) => (
            <SelectItem key={c.id} value={c.id} className="text-[13px]">
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Limpiar filtros — solo visible cuando hay al menos un filtro activo */}
      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-8 gap-1.5 px-2.5 text-[13px] text-muted-foreground hover:text-foreground"
          aria-label="Limpiar filtros"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}

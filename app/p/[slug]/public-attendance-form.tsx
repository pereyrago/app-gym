"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchPublicStudents, submitPublicAttendance } from "./actions";
import { formatClassDate } from "@/lib/app-timezone";
import { Loader2 } from "lucide-react";

type PublicClassOption = {
  id: string;
  class_date: string;
  start_time: string;
  duration_minutes: number;
  class_type_name: string;
};

type PublicStudentOption = { id: string; full_name: string };

const STORAGE_KEY = "qr-attendance";

function getStoredNames(): { full_name: string; dni: string; phone: string } {
  if (typeof window === "undefined") return { full_name: "", dni: "", phone: "" };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { full_name: "", dni: "", phone: "" };
    const parsed = JSON.parse(raw) as { full_name?: string; dni?: string; phone?: string };
    return {
      full_name: typeof parsed.full_name === "string" ? parsed.full_name : "",
      dni: typeof parsed.dni === "string" ? parsed.dni : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
    };
  } catch {
    return { full_name: "", dni: "", phone: "" };
  }
}

function setStoredNames(full_name: string, dni: string, phone: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ full_name, dni, phone }));
  } catch {
    // ignore
  }
}

interface PublicAttendanceFormProps {
  slug: string;
  classes: PublicClassOption[];
}

export function PublicAttendanceForm({ slug, classes }: PublicAttendanceFormProps) {
  const [isNewStudent, setIsNewStudent] = useState(false);
  const [classId, setClassId] = useState<string>("");
  const [nameQuery, setNameQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<PublicStudentOption | null>(null);
  const [suggestions, setSuggestions] = useState<PublicStudentOption[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newFullName, setNewFullName] = useState("");
  const [newDni, setNewDni] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [activeOptionIndex, setActiveOptionIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listboxId = "public-student-listbox";

  useEffect(() => {
    const s = getStoredNames();
    if (s.full_name) setNameQuery(s.full_name);
    setNewFullName(s.full_name);
    setNewDni(s.dni);
    setNewPhone(s.phone);
  }, []);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        return;
      }
      setLoadingSuggestions(true);
      try {
        const list = await searchPublicStudents(slug, query);
        setSuggestions(list);
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!nameQuery.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(nameQuery), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [nameQuery, fetchSuggestions]);

  const hasNewStudentData =
    isNewStudent && newFullName.trim().length > 0 && newPhone.trim().length > 0;
  const hasChosenStudent = selectedStudent !== null || hasNewStudentData;
  const canSubmit = Boolean(classId && hasChosenStudent);

  const showRegisterOption =
    nameQuery.trim().length >= 2 && !loadingSuggestions && suggestions.length === 0;
  const showListbox =
    !selectedStudent &&
    (suggestions.length > 0 || showRegisterOption);
  const optionCount = suggestions.length + (showRegisterOption ? 1 : 0);

  function selectOption(index: number) {
    if (index < 0 || index >= optionCount) return;
    if (index < suggestions.length) {
      const s = suggestions[index]!;
      setSelectedStudent(s);
      setNameQuery(s.full_name);
      setSuggestions([]);
    } else {
      handleChooseRegister();
    }
    setActiveOptionIndex(-1);
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showListbox || optionCount === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveOptionIndex((i) => (i + 1) % optionCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveOptionIndex((i) => (i <= 0 ? optionCount - 1 : i - 1));
    } else if (e.key === "Enter" && activeOptionIndex >= 0) {
      e.preventDefault();
      selectOption(activeOptionIndex);
    } else if (e.key === "Escape") {
      setActiveOptionIndex(-1);
      setSuggestions([]);
    }
  }

  function handleChooseRegister() {
    setNewFullName(nameQuery.trim());
    setSelectedStudent(null);
    setIsNewStudent(true);
    setSuggestions([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!classId) {
      setMessage({ type: "error", text: "Elegí una clase" });
      return;
    }
    let newStudentPayload: {
      full_name: string;
      dni?: string;
      email: string | null;
      phone: string;
    } | null = null;

    if (isNewStudent) {
      if (!newFullName.trim()) {
        setMessage({ type: "error", text: "Completá tu nombre" });
        return;
      }
      if (!newPhone.trim()) {
        setMessage({ type: "error", text: "Completá tu teléfono" });
        return;
      }
      const dniDigits = newDni.replace(/\s/g, "");
      if (dniDigits.length > 0 && dniDigits.length < 7) {
        setMessage({ type: "error", text: "DNI debe tener al menos 7 caracteres" });
        return;
      }
      newStudentPayload = {
        full_name: newFullName.trim(),
        ...(dniDigits.length > 0 ? { dni: dniDigits } : {}),
        email: newEmail.trim() || null,
        phone: newPhone.trim(),
      };
    } else {
      if (!selectedStudent) {
        setMessage({ type: "error", text: "Elegí tu nombre de la lista o registrate" });
        return;
      }
    }
    setSubmitting(true);
    try {
      const result = await submitPublicAttendance(
        slug,
        classId,
        isNewStudent ? null : (selectedStudent?.id ?? null),
        newStudentPayload
      );
      if (result.ok) {
        setMessage({ type: "success", text: "Asistencia registrada." });
        setClassId("");
        if (isNewStudent && newStudentPayload) {
          setStoredNames(
            newFullName.trim(),
            newDni.replace(/\s/g, ""),
            newPhone.trim()
          );
          setIsNewStudent(false);
          setNewEmail("");
          setNewPhone("");
        }
        setNameQuery("");
        setSelectedStudent(null);
        setSuggestions([]);
      } else {
        setMessage({ type: "error", text: result.error });
      }
    } catch {
      setMessage({ type: "error", text: "Error al enviar. Intentá de nuevo." });
    } finally {
      setSubmitting(false);
    }
  }

  if (classes.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        No hay clases en las próximas 24 horas para registrar asistencia.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="class-select">Clase</Label>
        <Select value={classId} onValueChange={setClassId}>
          <SelectTrigger id="class-select">
            <SelectValue placeholder="Seleccionar clase" />
          </SelectTrigger>
          <SelectContent>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.class_type_name} — {formatClassDate(c.class_date, "EEE d MMM")}{" "}
                {String(c.start_time).slice(0, 5)} ({c.duration_minutes} min)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {!isNewStudent ? (
          <div className="space-y-2">
            <Label htmlFor="name-input">Tu nombre</Label>
            <div className="relative">
              <Input
                id="name-input"
                type="text"
                placeholder="Escribí para buscar"
                value={nameQuery}
                onChange={(e) => {
                  setNameQuery(e.target.value);
                  setSelectedStudent(null);
                  setActiveOptionIndex(-1);
                }}
                onKeyDown={handleNameKeyDown}
                role="combobox"
                aria-expanded={showListbox}
                aria-controls={showListbox ? listboxId : undefined}
                aria-autocomplete="list"
                aria-activedescendant={
                  activeOptionIndex >= 0 ? `${listboxId}-option-${activeOptionIndex}` : undefined
                }
                autoComplete="off"
                className="pr-8"
              />
              {loadingSuggestions && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
              )}
              {showListbox && (
                  <ul
                    id={listboxId}
                    className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-background py-1 text-sm shadow-md"
                    role="listbox"
                  >
                    {suggestions.map((s, index) => (
                      <li
                        key={s.id}
                        id={`${listboxId}-option-${index}`}
                        role="option"
                        aria-selected={activeOptionIndex === index}
                        className={`cursor-pointer px-3 py-2 ${activeOptionIndex === index ? "bg-accent" : "hover:bg-accent"}`}
                        onMouseDown={() => selectOption(index)}
                      >
                        <span className="capitalize">{s.full_name}</span>
                      </li>
                    ))}
                    {showRegisterOption && (
                        <li
                          id={`${listboxId}-option-${suggestions.length}`}
                          role="option"
                          aria-selected={activeOptionIndex === suggestions.length}
                          className={`cursor-pointer border-t border-border px-3 py-2 font-medium text-primary ${activeOptionIndex === suggestions.length ? "bg-accent" : "hover:bg-accent"}`}
                          onMouseDown={handleChooseRegister}
                        >
                          No estoy en la lista — Registrate
                        </li>
                      )}
                  </ul>
                )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 rounded-md border border-border/80 bg-muted/30 p-3">
            <p className="text-[13px] font-medium text-muted-foreground">
              Completá tus datos para registrarte (el profesor te confirmará después).
            </p>
            <button
              type="button"
              onClick={() => setIsNewStudent(false)}
              className="text-[13px] text-primary underline hover:no-underline"
            >
              Buscar de nuevo en la lista
            </button>
            <div className="space-y-2">
              <Label htmlFor="new-fullname">Nombre completo</Label>
              <Input
                id="new-fullname"
                type="text"
                placeholder="Ej. Juan Pérez"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-phone">Teléfono (obligatorio)</Label>
              <Input
                id="new-phone"
                type="tel"
                placeholder="Ej. 11 1234-5678"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-dni">DNI (opcional)</Label>
              <Input
                id="new-dni"
                type="text"
                inputMode="numeric"
                placeholder="Ej. 12345678"
                value={newDni}
                onChange={(e) => setNewDni(e.target.value.replace(/\D/g, "").slice(0, 12))}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email (opcional)</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="ejemplo@mail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                autoComplete="email"
                spellCheck={false}
              />
            </div>
          </div>
        )}
      </div>

      {message && (
        <p
          role="status"
          aria-live="polite"
          className={
            message.type === "error"
              ? "text-sm text-destructive"
              : "text-sm text-emerald-500 dark:text-emerald-400"
          }
        >
          {message.text}
        </p>
      )}

      <Button type="submit" disabled={submitting || !canSubmit}>
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando…
          </>
        ) : (
          "Registrar asistencia"
        )}
      </Button>
    </form>
  );
}

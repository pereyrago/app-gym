"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, Loader2 } from "lucide-react";
import type { Period } from "@/types";

type LoadingKey = "one" | "all" | "student";

export function ReportPeriodField({
  id,
  label,
  value,
  onChange,
  periods,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  periods: Period[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-[13px]">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Seleccionar período" />
        </SelectTrigger>
        <SelectContent>
          {periods.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ReportPdfButton({
  loading,
  activeKey,
  disabled,
  onClick,
  children,
}: {
  loading: LoadingKey | null;
  activeKey: LoadingKey;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  const busy = loading === activeKey;
  return (
    <Button
      type="button"
      size="sm"
      className="h-8 rounded px-3 text-[13px] font-medium text-black"
      onClick={onClick}
      disabled={disabled || loading !== null}
    >
      {busy ? (
        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-3.5 w-3.5" />
      )}
      {children}
    </Button>
  );
}

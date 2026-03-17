"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const DISPLAY_FORMAT = "dd/MM/yyyy"; // dd mm aaaa
const VALUE_FORMAT = "yyyy-MM-dd"; // valor para el form (ISO date)

export interface DatePickerFieldProps {
  value: string; // yyyy-MM-dd
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  className,
  id,
  disabled,
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);

  const date = React.useMemo(() => {
    if (!value || value.length < 10) return undefined;
    const parsed = parse(value, VALUE_FORMAT, new Date());
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  const displayStr = date ? format(date, DISPLAY_FORMAT, { locale: es }) : "";

  function handleSelect(d: Date | undefined) {
    if (!d) return;
    onChange(format(d, VALUE_FORMAT));
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !displayStr && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {displayStr || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          defaultMonth={date ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}

"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ControlProps } from "./form-field";

interface ChoiceSelectProps<T extends string> {
  control: ControlProps;
  value: T | "";
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  placeholder: string;
}

export function ChoiceSelect<T extends string>({ control, value, onChange, options, placeholder }: ChoiceSelectProps<T>) {
  return (
    <Select value={value || undefined} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger
        id={control.id}
        aria-invalid={control["aria-invalid"]}
        aria-describedby={control["aria-describedby"]}
        className="w-full"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

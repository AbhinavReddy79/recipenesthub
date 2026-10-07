"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServingsStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function ServingsStepper({ value, onChange, min = 1, max = 48, label = "Servings", size = "md", className }: ServingsStepperProps) {
  const button = cn(
    "flex items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:pointer-events-none disabled:opacity-40",
    size === "sm" ? "size-7" : "size-8",
  );
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-center gap-0.5 rounded-full border bg-card p-0.5 shadow-xs", className)}
    >
      <button type="button" className={button} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Decrease ${label.toLowerCase()}`}>
        <Minus className="size-3.5" />
      </button>
      <output aria-live="polite" className={cn("text-center font-medium tabular-nums", size === "sm" ? "min-w-6 text-sm" : "min-w-8")}>
        {value}
      </output>
      <button type="button" className={button} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Increase ${label.toLowerCase()}`}>
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { newStep, type RecipeDraft, type StepErrors } from "@/lib/recipes/draft";

type Step = RecipeDraft["steps"][number];

interface InstructionEditorProps {
  value: Step[];
  onChange: (value: Step[]) => void;
  errors: StepErrors;
}

export function InstructionEditor({ value, onChange, errors }: InstructionEditorProps) {
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    // Keep focus on the moved step's control for keyboard users.
    requestAnimationFrame(() => document.getElementById(`step-text-${next[target].id}`)?.focus());
  };

  return (
    <div className="grid gap-3">
      <ol className="grid gap-3">
        {value.map((step, index) => {
          const error = errors[`step-${step.id}`];
          return (
            <li key={step.id} className="flex gap-3 rounded-xl border bg-card p-3 sm:p-4">
              <span className="w-8 shrink-0 pt-1.5 text-center font-display text-2xl font-semibold text-primary tabular-nums" aria-hidden>
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="grid flex-1 gap-1.5">
                <label htmlFor={`step-text-${step.id}`} className="sr-only">
                  Step {index + 1}
                </label>
                <Textarea
                  id={`step-text-${step.id}`}
                  rows={2}
                  placeholder={index === 0 ? "e.g. Bring a large pot of salted water to a boil." : "What happens next?"}
                  value={step.text}
                  onChange={(e) => onChange(value.map((s) => (s.id === step.id ? { ...s, text: e.target.value } : s)))}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `step-error-${step.id}` : undefined}
                />
                {error && (
                  <p id={`step-error-${step.id}`} role="alert" className="text-[0.8125rem] text-destructive">
                    {error}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move step ${index + 1} up`}>
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => move(index, 1)}
                  disabled={index === value.length - 1}
                  aria-label={`Move step ${index + 1} down`}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onChange(value.filter((s) => s.id !== step.id))}
                  disabled={value.length <= 1}
                  aria-label={`Remove step ${index + 1}`}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      {errors.steps && (
        <p role="alert" className="text-[0.8125rem] text-destructive">
          {errors.steps}
        </p>
      )}
      <Button type="button" variant="outline" className="w-fit" onClick={() => onChange([...value, newStep()])}>
        <Plus />
        Add step
      </Button>
    </div>
  );
}

"use client";

import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DIETS } from "@/lib/recipes/query";
import { cn } from "@/lib/utils";
import { FormField } from "../form-field";
import type { StepProps } from "./basics-step";

const NUTRITION = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carbs", label: "Carbs", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
] as const;

export function DetailsStep({ draft, update, errors }: StepProps) {
  const number = (key: "prepMinutes" | "cookMinutes" | "servings", label: string, suffix: string) => (
    <FormField id={key} label={label} required error={errors[key]}>
      {(c) => (
        <div className="relative">
          <Input
            {...c}
            type="number"
            inputMode="numeric"
            min={key === "servings" ? 1 : 0}
            className="pr-14"
            value={draft[key]}
            onChange={(e) => update({ [key]: e.target.value })}
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        </div>
      )}
    </FormField>
  );

  return (
    <div className="grid gap-8">
      <div className="grid gap-5 sm:grid-cols-3">
        {number("prepMinutes", "Prep time", "min")}
        {number("cookMinutes", "Cook time", "min")}
        {number("servings", "Servings", "people")}
      </div>

      <fieldset className="grid gap-3">
        <legend className="mb-3 text-sm font-medium">Dietary tags</legend>
        <div className="flex flex-wrap gap-2">
          {DIETS.map((diet) => {
            const active = draft.diets.includes(diet);
            return (
              <button
                key={diet}
                type="button"
                aria-pressed={active}
                onClick={() => update({ diets: active ? draft.diets.filter((d) => d !== diet) : [...draft.diets, diet] })}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  active ? "border-herb bg-herb text-herb-foreground" : "bg-card hover:bg-muted",
                )}
              >
                {active && <Check className="size-3.5" aria-hidden />}
                {diet}
              </button>
            );
          })}
        </div>
      </fieldset>

      <FormField id="tags" label="Tags" hint="Comma-separated, e.g. weeknight, one-pot, spicy. Tags are searchable.">
        {(c) => (
          <Input {...c} placeholder="weeknight, one-pot" value={draft.tags} onChange={(e) => update({ tags: e.target.value })} />
        )}
      </FormField>

      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-medium">Nutrition per serving</legend>
        <p className="mb-2 text-sm text-muted-foreground">Optional — rough estimates are fine.</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {NUTRITION.map(({ key, label, unit }) => (
            <FormField key={key} id={`nutrition-${key}`} label={label} error={errors[`nutrition-${key}`]}>
              {(c) => (
                <div className="relative">
                  <Input
                    {...c}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="pr-12"
                    value={draft.nutrition[key]}
                    onChange={(e) => update({ nutrition: { ...draft.nutrition, [key]: e.target.value } })}
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                    {unit}
                  </span>
                </div>
              )}
            </FormField>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

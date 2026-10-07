"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AISLES, newIngredient, UNITS, type RecipeDraft, type StepErrors } from "@/lib/recipes/draft";
import { cn } from "@/lib/utils";
import type { IngredientAisle } from "@/types/recipe";

type Ingredient = RecipeDraft["ingredients"][number];

interface IngredientEditorProps {
  value: Ingredient[];
  onChange: (value: Ingredient[]) => void;
  errors: StepErrors;
}

export function IngredientEditor({ value, onChange, errors }: IngredientEditorProps) {
  const update = (id: string, patch: Partial<Ingredient>) =>
    onChange(value.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id: string) => onChange(value.filter((i) => i.id !== id));

  return (
    <div className="grid gap-3">
      <div className="hidden grid-cols-[6rem_7rem_1fr_9rem_2.5rem] gap-2 px-1 text-xs font-medium text-muted-foreground md:grid">
        <span>Quantity</span>
        <span>Unit</span>
        <span>Ingredient</span>
        <span>Aisle</span>
        <span className="sr-only">Remove</span>
      </div>
      <ol className="grid gap-3">
        {value.map((ingredient, index) => {
          const qtyError = errors[`qty-${ingredient.id}`];
          const nameError = errors[`name-${ingredient.id}`];
          return (
            <li key={ingredient.id} className="rounded-xl border bg-card p-3 md:border-0 md:bg-transparent md:p-0">
              <fieldset className="grid grid-cols-[1fr_1fr_2.5rem] gap-2 md:grid-cols-[6rem_7rem_1fr_9rem_2.5rem]">
                <legend className="sr-only">Ingredient {index + 1}</legend>
                <Input
                  aria-label={`Quantity for ingredient ${index + 1}`}
                  inputMode="decimal"
                  placeholder="1 1/2"
                  value={ingredient.quantity}
                  onChange={(e) => update(ingredient.id, { quantity: e.target.value })}
                  aria-invalid={qtyError ? true : undefined}
                />
                <Select value={ingredient.unit || "none"} onValueChange={(v) => update(ingredient.id, { unit: v === "none" ? "" : v })}>
                  <SelectTrigger className="w-full" aria-label={`Unit for ingredient ${index + 1}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u || "none"} value={u || "none"}>
                        {u || "— (count)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10 text-muted-foreground hover:text-destructive md:order-last"
                  onClick={() => remove(ingredient.id)}
                  disabled={value.length <= 1}
                  aria-label={`Remove ingredient ${index + 1}`}
                >
                  <Trash2 />
                </Button>
                <Input
                  className="col-span-3 md:col-span-1"
                  aria-label={`Ingredient ${index + 1} name`}
                  placeholder="e.g. garlic, finely minced"
                  value={ingredient.name}
                  onChange={(e) => update(ingredient.id, { name: e.target.value })}
                  aria-invalid={nameError ? true : undefined}
                />
                <Select value={ingredient.aisle} onValueChange={(v) => update(ingredient.id, { aisle: v as IngredientAisle })}>
                  <SelectTrigger className="col-span-3 w-full md:col-span-1" aria-label={`Shopping aisle for ingredient ${index + 1}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AISLES.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </fieldset>
              {(qtyError || nameError) && (
                <p role="alert" className={cn("mt-1.5 text-[0.8125rem] text-destructive")}>
                  {qtyError ?? nameError}
                </p>
              )}
            </li>
          );
        })}
      </ol>
      {errors.ingredients && (
        <p role="alert" className="text-[0.8125rem] text-destructive">
          {errors.ingredients}
        </p>
      )}
      <Button type="button" variant="outline" className="w-fit" onClick={() => onChange([...value, newIngredient()])}>
        <Plus />
        Add Ingredient
      </Button>
    </div>
  );
}

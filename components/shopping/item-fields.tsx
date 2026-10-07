"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ShoppingItemInput } from "@/hooks/use-shopping-list";
import { AISLES, parseQuantity, UNITS } from "@/lib/recipes/draft";
import type { IngredientAisle } from "@/types/recipe";

export interface ItemFormState {
  name: string;
  quantity: string;
  unit: string;
  aisle: IngredientAisle;
}

export const emptyItem: ItemFormState = { name: "", quantity: "", unit: "", aisle: "Produce" };

/** Shared state + validation for adding and editing shopping items. */
export function useItemForm(
  initial: ItemFormState,
  onValid: (input: ShoppingItemInput, helpers: { setValues: (v: ItemFormState) => void }) => void,
) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!values.name.trim()) return setError("Enter an item name.");
    const quantity = parseQuantity(values.quantity);
    if (quantity !== null && (Number.isNaN(quantity) || quantity <= 0)) return setError("Quantity must be a positive number.");
    setError(undefined);
    onValid({ name: values.name.trim(), quantity, unit: values.unit, aisle: values.aisle }, { setValues });
  };

  return { values, setValues, error, submit };
}

export function ItemFields({
  values,
  setValues,
  idPrefix,
  error,
}: {
  values: ItemFormState;
  setValues: (v: ItemFormState) => void;
  idPrefix: string;
  error?: string;
}) {
  return (
    <>
      <Input
        id={`${idPrefix}-name`}
        aria-label="Item name"
        placeholder="Add an item, e.g. oat milk"
        value={values.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
        aria-invalid={error ? true : undefined}
        className="min-w-0 sm:flex-1"
      />
      <div className="flex gap-2">
        <Input
          aria-label="Quantity"
          inputMode="decimal"
          placeholder="Qty"
          value={values.quantity}
          onChange={(e) => setValues({ ...values, quantity: e.target.value })}
          className="w-20"
        />
        <Select value={values.unit || "none"} onValueChange={(v) => setValues({ ...values, unit: v === "none" ? "" : v })}>
          <SelectTrigger aria-label="Unit" className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNITS.map((u) => (
              <SelectItem key={u || "none"} value={u || "none"}>
                {u || "unit"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={values.aisle} onValueChange={(v) => setValues({ ...values, aisle: v as IngredientAisle })}>
          <SelectTrigger aria-label="Category" className="w-28">
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
      </div>
    </>
  );
}

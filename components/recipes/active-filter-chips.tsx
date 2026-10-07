"use client";

import { X } from "lucide-react";
import { CATEGORY_LABELS, CUISINE_LABELS } from "@/lib/labels";
import { TIME_OPTIONS } from "@/lib/recipes/query";
import type { RecipeFilters } from "@/types/recipe";

interface Chip {
  key: string;
  label: string;
  remove: Partial<RecipeFilters>;
}

export function ActiveFilterChips({
  filters,
  onChange,
  onClear,
}: {
  filters: RecipeFilters;
  onChange: (update: Partial<RecipeFilters>) => void;
  onClear: () => void;
}) {
  const chips: Chip[] = [
    ...(filters.category
      ? [{ key: "category", label: CATEGORY_LABELS[filters.category], remove: { category: null } }]
      : []),
    ...filters.cuisines.map((c) => ({
      key: `c-${c}`,
      label: CUISINE_LABELS[c],
      remove: { cuisines: filters.cuisines.filter((x) => x !== c) },
    })),
    ...filters.diets.map((d) => ({
      key: `d-${d}`,
      label: d,
      remove: { diets: filters.diets.filter((x) => x !== d) },
    })),
    ...filters.mealTypes.map((m) => ({
      key: `m-${m}`,
      label: m,
      remove: { mealTypes: filters.mealTypes.filter((x) => x !== m) },
    })),
    ...filters.difficulties.map((d) => ({
      key: `l-${d}`,
      label: d,
      remove: { difficulties: filters.difficulties.filter((x) => x !== d) },
    })),
    ...(filters.maxMinutes !== null
      ? [
          {
            key: "time",
            label: TIME_OPTIONS.find((o) => o.value === filters.maxMinutes)?.label ?? `≤ ${filters.maxMinutes} min`,
            remove: { maxMinutes: null },
          },
        ]
      : []),
  ];

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.remove)}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent py-1 pr-2 pl-3 text-[0.8125rem] font-medium text-accent-foreground transition-colors hover:bg-terracotta-soft"
          aria-label={`Remove filter: ${chip.label}`}
        >
          {chip.label}
          <X className="size-3.5" aria-hidden />
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="px-2 text-[0.8125rem] font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

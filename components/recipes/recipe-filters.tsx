"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CUISINE_LABELS, CUISINE_SLUGS } from "@/lib/labels";
import { DIETS, DIFFICULTIES, MEAL_TYPES, TIME_OPTIONS } from "@/lib/recipes/query";
import { cn } from "@/lib/utils";
import type { Recipe, RecipeFilters as Filters } from "@/types/recipe";

interface RecipeFiltersProps {
  filters: Filters;
  onChange: (update: Partial<Filters>) => void;
  /** Recipes used to compute option counts (already matched against the search query). */
  facetSource: Recipe[];
  idPrefix: string;
  className?: string;
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function FilterGroup({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-2.5 border-b pb-6 last:border-b-0">
      <legend className="mb-3 text-sm font-semibold">{legend}</legend>
      {children}
    </fieldset>
  );
}

function CheckOption({
  id,
  label,
  count,
  checked,
  onToggle,
}: {
  id: string;
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Checkbox id={id} checked={checked} onCheckedChange={onToggle} />
      <Label
        htmlFor={id}
        className={cn(
          "flex flex-1 cursor-pointer justify-between text-sm font-normal",
          count === 0 && !checked && "text-muted-foreground",
        )}
      >
        {label}
        <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
      </Label>
    </div>
  );
}

export function RecipeFilters({ filters, onChange, facetSource, idPrefix, className }: RecipeFiltersProps) {
  const count = (predicate: (r: Recipe) => boolean) => facetSource.filter(predicate).length;
  const cuisineOptions = CUISINE_SLUGS.filter((slug) => facetSource.some((r) => r.cuisine === slug) || filters.cuisines.includes(slug));

  return (
    <div className={cn("grid gap-6", className)}>
      <FilterGroup legend="Cuisine">
        {cuisineOptions.map((slug) => (
          <CheckOption
            key={slug}
            id={`${idPrefix}-cuisine-${slug}`}
            label={CUISINE_LABELS[slug]}
            count={count((r) => r.cuisine === slug)}
            checked={filters.cuisines.includes(slug)}
            onToggle={() => onChange({ cuisines: toggle(filters.cuisines, slug) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup legend="Diet">
        {DIETS.map((diet) => (
          <CheckOption
            key={diet}
            id={`${idPrefix}-diet-${diet}`}
            label={diet}
            count={count((r) => r.diets.includes(diet))}
            checked={filters.diets.includes(diet)}
            onToggle={() => onChange({ diets: toggle(filters.diets, diet) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup legend="Meal type">
        {MEAL_TYPES.map((meal) => (
          <CheckOption
            key={meal}
            id={`${idPrefix}-meal-${meal}`}
            label={meal}
            count={count((r) => r.mealType === meal)}
            checked={filters.mealTypes.includes(meal)}
            onToggle={() => onChange({ mealTypes: toggle(filters.mealTypes, meal) })}
          />
        ))}
      </FilterGroup>

      <FilterGroup legend="Difficulty">
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((level) => {
            const active = filters.difficulties.includes(level);
            return (
              <button
                key={level}
                type="button"
                aria-pressed={active}
                onClick={() => onChange({ difficulties: toggle(filters.difficulties, level) })}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-card hover:border-primary/40 hover:bg-accent",
                )}
              >
                {level}
              </button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup legend="Cooking time">
        <RadioGroup
          value={String(filters.maxMinutes ?? "any")}
          onValueChange={(value) => onChange({ maxMinutes: value === "any" ? null : Number(value) })}
          className="gap-2.5"
        >
          {TIME_OPTIONS.map((option) => {
            const value = String(option.value ?? "any");
            return (
              <div key={value} className="flex items-center gap-2.5">
                <RadioGroupItem value={value} id={`${idPrefix}-time-${value}`} />
                <Label htmlFor={`${idPrefix}-time-${value}`} className="cursor-pointer text-sm font-normal">
                  {option.label}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </FilterGroup>

    </div>
  );
}

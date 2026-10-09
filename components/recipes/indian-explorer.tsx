"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, MapPin, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { INDIAN_REGIONS, INDIAN_STATES, REGION_BLURBS } from "@/lib/indian-states";
import { cn } from "@/lib/utils";
import type { IndianRegion, Recipe } from "@/types/recipe";
import { MEALS, MealSections } from "./meal-sections";
import { RecipeGrid } from "./recipe-grid";

type RegionFilter = IndianRegion | "All";
type View = "state" | "meal";

const MEAL_ORDER = new Map(MEALS.map((m, i) => [m.type, i]));
const MEAL_BY_TYPE = new Map(MEALS.map((m) => [m.type, m]));

const stateId = (name: string) => `state-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

/** The meal a dish is eaten at, shown on its photo in the state view. */
function MealBadge({ recipe }: { recipe: Recipe }) {
  const meal = MEAL_BY_TYPE.get(recipe.mealType);
  if (!meal) return null;
  const Icon = meal.icon;
  return (
    <Badge data-tone={meal.tone} className="gap-1 bg-tone text-tone-foreground shadow-soft">
      <Icon className="size-3" aria-hidden />
      {meal.label}
    </Badge>
  );
}

/**
 * Every state as its own section with its dishes, grouped under its region
 * and ordered north to south. Dishes run Breakfast → Lunch → Snacks → Dinner.
 */
function StateSections({ recipes }: { recipes: Recipe[] }) {
  const regions = useMemo(() => {
    const byState = new Map<string, Recipe[]>();
    for (const r of recipes) if (r.state) byState.set(r.state, [...(byState.get(r.state) ?? []), r]);

    const groups: { region: IndianRegion; states: { name: string; recipes: Recipe[] }[] }[] = [];
    for (const { name, region } of INDIAN_STATES) {
      const list = byState.get(name);
      if (!list) continue;
      list.sort((a, b) => (MEAL_ORDER.get(a.mealType) ?? 99) - (MEAL_ORDER.get(b.mealType) ?? 99) || b.editorScore - a.editorScore);
      let group = groups.find((g) => g.region === region);
      if (!group) groups.push((group = { region, states: [] }));
      group.states.push({ name, recipes: list });
    }
    return groups;
  }, [recipes]);

  if (regions.length === 0) {
    return <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No dishes from here yet.</p>;
  }

  return (
    <div className="grid gap-16">
      {regions.map(({ region, states }) => (
        <section key={region} aria-labelledby={`region-${region}`} className="grid gap-8">
          <div className="grid gap-1 border-b border-border/70 pb-4">
            <h3 id={`region-${region}`} className="text-[1.75rem] leading-tight font-semibold">
              {region} India
            </h3>
            <p className="text-sm text-muted-foreground">
              {REGION_BLURBS[region]} · {states.length} {states.length === 1 ? "state" : "states"}
            </p>
          </div>

          {states.map(({ name, recipes: list }) => (
            <section key={name} id={stateId(name)} aria-labelledby={`${stateId(name)}-heading`} className="scroll-mt-28">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
                  <MapPin className="size-4" aria-hidden />
                </span>
                <h4 id={`${stateId(name)}-heading`} className="text-xl leading-tight font-semibold sm:text-2xl">
                  {name}
                </h4>
                <span className="text-sm text-muted-foreground">
                  {list.length} {list.length === 1 ? "recipe" : "recipes"}
                </span>
              </div>
              <RecipeGrid recipes={list} renderBadge={(recipe) => <MealBadge recipe={recipe} />} />
            </section>
          ))}
        </section>
      ))}
    </div>
  );
}

/**
 * Explore Indian food from north to south: pick a region, then a state, and
 * see the dishes state by state, or grouped into Breakfast, Lunch, Snacks and Dinner.
 */
export function IndianExplorer({ recipes }: { recipes: Recipe[] }) {
  const [region, setRegion] = useState<RegionFilter>("All");
  const [state, setState] = useState<string | null>(null);
  const [view, setView] = useState<View>("state");

  const countByRegion = useMemo(() => {
    const counts: Record<string, number> = { All: recipes.length };
    for (const r of recipes) if (r.region) counts[r.region] = (counts[r.region] ?? 0) + 1;
    return counts;
  }, [recipes]);

  // States in the chosen region that have at least one dish, north to south.
  const states = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of recipes) if (r.state && (region === "All" || r.region === region)) counts.set(r.state, (counts.get(r.state) ?? 0) + 1);
    return INDIAN_STATES.filter((s) => counts.has(s.name)).map((s) => ({ ...s, count: counts.get(s.name) ?? 0 }));
  }, [recipes, region]);

  const visible = useMemo(
    () => recipes.filter((r) => (region === "All" || r.region === region) && (!state || r.state === state)),
    [recipes, region, state],
  );

  const chooseRegion = (next: RegionFilter) => {
    setRegion(next);
    setState(null);
  };

  return (
    <div className="grid gap-10">
      <section id="explore-india" aria-labelledby="explore-india-heading" className="scroll-mt-24 grid gap-5 rounded-3xl bg-warm-glow p-5 ring-1 ring-border/70 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1">
            <h3 id="explore-india-heading" className="flex items-center gap-2 text-2xl font-semibold">
              <MapPin className="size-5 text-gold-ink" aria-hidden />
              Explore India, north to south
            </h3>
            <p className="text-sm text-muted-foreground">
              {region === "All"
                ? `${states.length} states and union territories, from Kashmir to Kerala and Gujarat to the Northeast.`
                : REGION_BLURBS[region]}
            </p>
          </div>

          <div role="group" aria-label="Show dishes" className="inline-flex rounded-full bg-card p-1 shadow-soft ring-1 ring-border">
            {(
              [
                { value: "state", label: "By state", icon: LayoutGrid },
                { value: "meal", label: "By meal", icon: UtensilsCrossed },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={view === value}
                onClick={() => setView(value)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  view === value ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div role="tablist" aria-label="Region" className="-mx-1 flex flex-wrap gap-2">
          {(["All", ...INDIAN_REGIONS] as RegionFilter[]).map((option) => {
            const active = region === option;
            return (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => chooseRegion(option)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-glow" : "bg-card shadow-soft ring-1 ring-border hover:bg-muted",
                )}
              >
                {option === "All" ? "All India" : `${option} India`}
                <span className={cn("text-xs tabular-nums", active ? "opacity-80" : "text-muted-foreground")}>
                  {countByRegion[option] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-2">
          <p className="text-xs font-bold tracking-[0.14em] text-gold-ink uppercase">States</p>
          <ul className="flex flex-wrap gap-2">
            <li>
              <button
                type="button"
                aria-pressed={state === null}
                onClick={() => setState(null)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  state === null ? "border-primary bg-accent font-semibold text-accent-foreground" : "bg-card hover:bg-muted",
                )}
              >
                All states
              </button>
            </li>
            {states.map((s) => (
              <li key={s.name}>
                <button
                  type="button"
                  aria-pressed={state === s.name}
                  onClick={() => setState(state === s.name ? null : s.name)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    state === s.name ? "border-primary bg-accent font-semibold text-accent-foreground" : "bg-card hover:bg-muted",
                  )}
                >
                  {s.name} <span className="text-xs text-muted-foreground tabular-nums">{s.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div aria-live="polite" className="sr-only">
        {visible.length} recipes shown
      </div>
      {view === "state" ? (
        <StateSections recipes={visible} />
      ) : (
        <MealSections recipes={visible} emptyText="No dishes from here yet." />
      )}
    </div>
  );
}

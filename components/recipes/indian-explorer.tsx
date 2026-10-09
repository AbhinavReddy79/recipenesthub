"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { INDIAN_REGIONS, INDIAN_STATES, REGION_BLURBS } from "@/lib/indian-states";
import { cn } from "@/lib/utils";
import type { IndianRegion, Recipe } from "@/types/recipe";
import { MealSections } from "./meal-sections";

type RegionFilter = IndianRegion | "All";

/**
 * Explore Indian food from north to south: pick a region, then a state, and
 * see its dishes grouped into Breakfast, Lunch, Snacks and Dinner.
 */
export function IndianExplorer({ recipes }: { recipes: Recipe[] }) {
  const [region, setRegion] = useState<RegionFilter>("All");
  const [state, setState] = useState<string | null>(null);

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
      <MealSections recipes={visible} emptyText="No dishes from here yet." />
    </div>
  );
}

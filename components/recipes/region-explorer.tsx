"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, MapPin, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CUISINE_REGIONS, placeAnchor } from "@/lib/cuisine-regions";
import { cn } from "@/lib/utils";
import type { CuisineSlug, Recipe } from "@/types/recipe";
import { MEALS, MealSections } from "./meal-sections";
import { RecipeGrid } from "./recipe-grid";

const ALL = "All";
type View = "place" | "meal";

const MEAL_ORDER = new Map(MEALS.map((m, i) => [m.type, i]));
const MEAL_BY_TYPE = new Map(MEALS.map((m) => [m.type, m]));
const OTHER = "More recipes";

const byMealThenScore = (a: Recipe, b: Recipe) =>
  (MEAL_ORDER.get(a.mealType) ?? 99) - (MEAL_ORDER.get(b.mealType) ?? 99) || b.editorScore - a.editorScore;

/** The meal a dish is eaten at, shown on its photo in the place view. */
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

function PlaceHeading({ id, name, count, as: Heading }: { id: string; name: string; count: number; as: "h3" | "h4" }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <MapPin className="size-4" aria-hidden />
      </span>
      <Heading id={id} className="text-xl leading-tight font-semibold sm:text-2xl">
        {name}
      </Heading>
      <span className="text-sm text-muted-foreground">
        {count} {count === 1 ? "recipe" : "recipes"}
      </span>
    </div>
  );
}

/**
 * Every place (state, region, city or country) as its own section with its
 * dishes, grouped under its wider region in the cuisine's order. Dishes run
 * Breakfast → Lunch → Snacks → Dinner.
 */
function PlaceSections({ cuisine, recipes }: { cuisine: CuisineSlug; recipes: Recipe[] }) {
  const { regions, places } = CUISINE_REGIONS[cuisine];

  const groups = useMemo(() => {
    const byPlace = new Map<string, Recipe[]>();
    const unplaced: Recipe[] = [];
    for (const r of recipes) {
      if (r.state) byPlace.set(r.state, [...(byPlace.get(r.state) ?? []), r]);
      else unplaced.push(r);
    }

    const result: { region: string; blurb?: string; places: { name: string; recipes: Recipe[] }[] }[] = [];
    for (const { name, region } of places) {
      const list = byPlace.get(name);
      if (!list) continue;
      let group = result.find((g) => g.region === region);
      if (!group) result.push((group = { region, blurb: regions.find((r) => r.name === region)?.blurb, places: [] }));
      group.places.push({ name, recipes: list.sort(byMealThenScore) });
    }
    // Recipes members add don't have a place yet.
    if (unplaced.length) result.push({ region: OTHER, places: [{ name: OTHER, recipes: unplaced.sort(byMealThenScore) }] });
    return result;
  }, [recipes, places, regions]);

  if (groups.length === 0) {
    return <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">No dishes from here yet.</p>;
  }

  return (
    <div className="grid gap-16">
      {groups.map(({ region, blurb, places: list }) => {
        const regionId = placeAnchor(region).replace(/^place-/, "region-");
        // A region that is a single place of the same name ("Across Italy") needs no second heading.
        const flat = list.length === 1 && list[0].name === region;
        return (
          <section key={region} id={flat ? placeAnchor(region) : regionId} aria-labelledby={`${regionId}-heading`} className="grid scroll-mt-28 gap-8">
            <div className="grid gap-1 border-b border-border/70 pb-4">
              <h3 id={`${regionId}-heading`} className="text-[1.75rem] leading-tight font-semibold">
                {region}
              </h3>
              <p className="text-sm text-muted-foreground">
                {blurb ?? "Recipes shared by the RecipeNest community."}
                {flat
                  ? ` · ${list[0].recipes.length} ${list[0].recipes.length === 1 ? "recipe" : "recipes"}`
                  : ` · ${list.length} places`}
              </p>
            </div>

            {flat ? (
              <RecipeGrid recipes={list[0].recipes} renderBadge={(recipe) => <MealBadge recipe={recipe} />} />
            ) : (
              list.map(({ name, recipes: dishes }) => {
                const id = placeAnchor(name);
                return (
                  <section key={name} id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28">
                    <PlaceHeading id={`${id}-heading`} name={name} count={dishes.length} as="h4" />
                    <RecipeGrid recipes={dishes} renderBadge={(recipe) => <MealBadge recipe={recipe} />} />
                  </section>
                );
              })
            )}
          </section>
        );
      })}
    </div>
  );
}

/**
 * Explore a cuisine place by place: pick a region, then a state, city or
 * country, and see the dishes place by place, or grouped into Breakfast,
 * Lunch, Snacks and Dinner.
 */
export function RegionExplorer({ cuisine, recipes }: { cuisine: CuisineSlug; recipes: Recipe[] }) {
  const { title, intro, placeLabel, regions, places } = CUISINE_REGIONS[cuisine];
  const [region, setRegion] = useState<string>(ALL);
  const [place, setPlace] = useState<string | null>(null);
  const [view, setView] = useState<View>("place");

  const countByRegion = useMemo(() => {
    const counts: Record<string, number> = { [ALL]: recipes.length };
    for (const r of recipes) if (r.region) counts[r.region] = (counts[r.region] ?? 0) + 1;
    return counts;
  }, [recipes]);

  // Only regions and places that have at least one dish, in the cuisine's order.
  const regionTabs = regions.filter((r) => countByRegion[r.name]);
  const placeChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of recipes) if (r.state && (region === ALL || r.region === region)) counts.set(r.state, (counts.get(r.state) ?? 0) + 1);
    return places.filter((p) => counts.has(p.name)).map((p) => ({ ...p, count: counts.get(p.name) ?? 0 }));
  }, [recipes, region, places]);

  const visible = useMemo(
    () => recipes.filter((r) => (region === ALL || r.region === region) && (!place || r.state === place)),
    [recipes, region, place],
  );

  const chooseRegion = (next: string) => {
    setRegion(next);
    setPlace(null);
  };

  const currentBlurb = regions.find((r) => r.name === region)?.blurb;

  return (
    <div className="grid gap-10">
      <section id="explore" aria-labelledby="explore-heading" className="scroll-mt-24 grid gap-5 rounded-3xl bg-warm-glow p-5 ring-1 ring-border/70 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-1">
            <h3 id="explore-heading" className="flex items-center gap-2 text-2xl font-semibold">
              <MapPin className="size-5 text-gold-ink" aria-hidden />
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {region === ALL ? `${placeChips.length} ${placeLabel.toLowerCase()}. ${intro}` : currentBlurb}
            </p>
          </div>

          <div role="group" aria-label="Show dishes" className="inline-flex rounded-full bg-card p-1 shadow-soft ring-1 ring-border">
            {(
              [
                { value: "place", label: `By ${placeLabel === "States" ? "state" : "place"}`, icon: LayoutGrid },
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
          {[ALL, ...regionTabs.map((r) => r.name)].map((option) => {
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
                {option === ALL ? "Everywhere" : option}
                <span className={cn("text-xs tabular-nums", active ? "opacity-80" : "text-muted-foreground")}>
                  {countByRegion[option] ?? 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid gap-2">
          <p className="text-xs font-bold tracking-[0.14em] text-gold-ink uppercase">{placeLabel}</p>
          <ul className="flex flex-wrap gap-2">
            <li>
              <button
                type="button"
                aria-pressed={place === null}
                onClick={() => setPlace(null)}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm transition-colors",
                  place === null ? "border-primary bg-accent font-semibold text-accent-foreground" : "bg-card hover:bg-muted",
                )}
              >
                All {placeLabel.toLowerCase()}
              </button>
            </li>
            {placeChips.map((p) => (
              <li key={p.name}>
                <button
                  type="button"
                  aria-pressed={place === p.name}
                  onClick={() => setPlace(place === p.name ? null : p.name)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm transition-colors",
                    place === p.name ? "border-primary bg-accent font-semibold text-accent-foreground" : "bg-card hover:bg-muted",
                  )}
                >
                  {p.name} <span className="text-xs text-muted-foreground tabular-nums">{p.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div aria-live="polite" className="sr-only">
        {visible.length} recipes shown
      </div>
      {view === "place" ? (
        <PlaceSections cuisine={cuisine} recipes={visible} />
      ) : (
        <MealSections recipes={visible} emptyText="No dishes from here yet." />
      )}
    </div>
  );
}

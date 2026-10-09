"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { ArrowLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CUISINE_REGIONS, placeSlug } from "@/lib/cuisine-regions";
import { FALLBACK_RECIPE_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";
import type { CuisineSlug, Recipe } from "@/types/recipe";
import { MealSections } from "./meal-sections";

const ALL = "All";
/** Recipes members add don't have a place yet; they get a card of their own. */
const OTHER = "More recipes";

// The chosen place lives in the URL (?place=kerala), so links from a recipe
// page open it directly and the Back button returns to the picker.
const PLACE_EVENT = "recipenest:place";
function subscribeToPlace(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(PLACE_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(PLACE_EVENT, onChange);
  };
}
const readPlace = () => new URLSearchParams(window.location.search).get("place") ?? "";
const noPlaceOnServer = () => "";

function setPlace(slug: string | null) {
  const url = new URL(window.location.href);
  url.hash = "";
  if (slug) url.searchParams.set("place", slug);
  else url.searchParams.delete("place");
  window.history.pushState(window.history.state, "", url);
  window.dispatchEvent(new Event(PLACE_EVENT));
}

interface PlaceCard {
  name: string;
  region: string;
  recipes: Recipe[];
}

/**
 * Explore a cuisine place by place: first choose a state, region, city or
 * country, then see its dishes grouped into Breakfast, Lunch, Snacks and Dinner.
 */
export function RegionExplorer({ cuisine, recipes }: { cuisine: CuisineSlug; recipes: Recipe[] }) {
  const { title, intro, placeLabel, regions, places } = CUISINE_REGIONS[cuisine];
  const singular = placeLabel === "Countries" ? "country" : placeLabel === "Cities" ? "city" : placeLabel.slice(0, -1).toLowerCase();
  const [region, setRegion] = useState<string>(ALL);
  const panelRef = useRef<HTMLElement>(null);
  const placeParam = useSyncExternalStore(subscribeToPlace, readPlace, noPlaceOnServer);

  // Every place with at least one dish, in the cuisine's north-to-south order.
  const cards = useMemo(() => {
    const byPlace = new Map<string, Recipe[]>();
    const unplaced: Recipe[] = [];
    for (const r of recipes) {
      if (r.state) byPlace.set(r.state, [...(byPlace.get(r.state) ?? []), r]);
      else unplaced.push(r);
    }
    const list: PlaceCard[] = places
      .filter((p) => byPlace.has(p.name))
      .map((p) => ({ ...p, recipes: byPlace.get(p.name) ?? [] }));
    if (unplaced.length) list.push({ name: OTHER, region: OTHER, recipes: unplaced });
    return list;
  }, [recipes, places]);

  const selected = cards.find((c) => placeSlug(c.name) === placeParam) ?? null;
  const regionTabs = regions.filter((r) => cards.some((c) => c.region === r.name));
  const shown = region === ALL ? cards : cards.filter((c) => c.region === region);

  const choose = (card: PlaceCard | null) => {
    setPlace(card ? placeSlug(card.name) : null);
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid gap-10">
      <section
        ref={panelRef}
        id="explore"
        aria-labelledby="explore-heading"
        className="scroll-mt-24 grid gap-5 rounded-3xl bg-warm-glow p-5 ring-1 ring-border/70 sm:p-7"
      >
        {selected ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => choose(null)}>
                <ArrowLeft aria-hidden />
                All {placeLabel.toLowerCase()}
              </Button>
              {selected.region !== selected.name && (
                <p className="text-xs font-bold tracking-[0.14em] text-gold-ink uppercase">{selected.region}</p>
              )}
            </div>
            <div className="grid gap-1">
              <h3 id="explore-heading" className="flex items-center gap-2 text-3xl font-semibold">
                <MapPin className="size-6 text-gold-ink" aria-hidden />
                {selected.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selected.recipes.length} {selected.recipes.length === 1 ? "recipe" : "recipes"}
                {selected.region === OTHER
                  ? " shared by the RecipeNest community."
                  : ` · ${regions.find((r) => r.name === selected.region)?.blurb ?? ""}`}
              </p>
            </div>
            {/* Quick switch to the other places in the same region. */}
            {cards.filter((c) => c.region === selected.region).length > 1 && (
              <ul className="flex flex-wrap gap-2" aria-label={`Other ${placeLabel.toLowerCase()} in ${selected.region}`}>
                {cards
                  .filter((c) => c.region === selected.region)
                  .map((c) => (
                    <li key={c.name}>
                      <button
                        type="button"
                        aria-pressed={c === selected}
                        onClick={() => choose(c)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-sm transition-colors",
                          c === selected ? "border-primary bg-accent font-semibold text-accent-foreground" : "bg-card hover:bg-muted",
                        )}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <div className="grid gap-1">
              <h3 id="explore-heading" className="flex items-center gap-2 text-2xl font-semibold">
                <MapPin className="size-5 text-gold-ink" aria-hidden />
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose a {singular} to see its recipes. {intro}
              </p>
            </div>

            {regionTabs.length > 1 && (
              <div role="tablist" aria-label="Region" className="-mx-1 flex flex-wrap gap-2">
                {[ALL, ...regionTabs.map((r) => r.name)].map((option) => {
                  const active = region === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setRegion(option)}
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                        active ? "bg-primary text-primary-foreground shadow-glow" : "bg-card shadow-soft ring-1 ring-border hover:bg-muted",
                      )}
                    >
                      {option === ALL ? "Everywhere" : option}
                    </button>
                  );
                })}
              </div>
            )}

            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
              {shown.map((card) => {
                const cover = [...card.recipes].sort((a, b) => b.editorScore - a.editorScore)[0];
                return (
                  <li key={card.name}>
                    <button
                      type="button"
                      onClick={() => choose(card)}
                      className="group relative flex aspect-[4/3] w-full overflow-hidden rounded-2xl text-left shadow-soft ring-1 ring-border/60 transition-shadow hover:shadow-glow focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      <Image
                        src={cover?.image || FALLBACK_RECIPE_IMAGE}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <span className="relative mt-auto flex w-full items-end justify-between gap-2 p-3 text-white sm:p-4">
                        <span className="grid min-w-0 gap-0.5">
                          {card.region !== card.name && (
                            <span className="truncate text-[0.625rem] font-bold tracking-[0.12em] text-white/75 uppercase sm:text-[0.6875rem]">
                              {card.region}
                            </span>
                          )}
                          <span className="font-display text-base leading-tight font-semibold sm:text-lg">{card.name}</span>
                          <span className="text-xs text-white/80">
                            {card.recipes.length} {card.recipes.length === 1 ? "recipe" : "recipes"}
                          </span>
                        </span>
                        <ChevronRight className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      {selected && <MealSections recipes={selected.recipes} emptyText="No dishes from here yet." />}
    </div>
  );
}

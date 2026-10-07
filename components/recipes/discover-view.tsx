"use client";

import { useMemo, useState } from "react";
import { Leaf, SearchX, SlidersHorizontal } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCatalog } from "@/hooks/use-catalog";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSettings } from "@/hooks/use-settings";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { CATEGORY_LABELS, CATEGORY_SLUGS } from "@/lib/labels";
import { countActiveFilters, emptyFilters, filterRecipes, searchRecipes, sortRecipes } from "@/lib/recipes/query";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";
import { ActiveFilterChips } from "./active-filter-chips";
import { RecipeFilters } from "./recipe-filters";
import { RecipeGrid } from "./recipe-grid";
import { RecipeSearchForm } from "./recipe-search-form";
import { SortSelect } from "./sort-select";

const PAGE_SIZE = 12;

export function DiscoverView({ recipes: serverRecipes }: { recipes: Recipe[] }) {
  const { recipes } = useCatalog(serverRecipes);
  const { filters, sort, setFilters, setSort, replaceFilters } = useUrlFilters();
  const hydrated = useHydrated();
  const myDiet = useSettings().preferences.diet;
  const dietActive = myDiet !== "None" && filters.diets.includes(myDiet);
  const [sheetOpen, setSheetOpen] = useState(false);

  const facetSource = useMemo(() => searchRecipes(recipes, filters.query), [recipes, filters.query]);
  const results = useMemo(() => sortRecipes(filterRecipes(recipes, filters), sort), [recipes, filters, sort]);

  // Reset pagination whenever the filters change.
  const filterKey = JSON.stringify([filters, sort]);
  const [page, setPage] = useState({ key: filterKey, count: PAGE_SIZE });
  const visible = page.key === filterKey ? page.count : PAGE_SIZE;

  const activeCount = countActiveFilters({ ...filters, category: null });
  const clearAll = () => replaceFilters({ ...emptyFilters, query: filters.query });

  return (
    <div className="container-page pb-24">
      <div className="-mt-7 max-w-2xl">
        <RecipeSearchForm
          size="lg"
          defaultValue={filters.query}
          placeholder="Search by dish, ingredient or cuisine…"
          onQueryChange={(query) => setFilters({ query })}
          onSearch={(query) => setFilters({ query })}
          label="Search discover recipes"
        />
      </div>

      {hydrated && myDiet !== "None" && (
        <button
          type="button"
          aria-pressed={dietActive}
          onClick={() =>
            setFilters({ diets: dietActive ? filters.diets.filter((d) => d !== myDiet) : [...filters.diets, myDiet] })
          }
          className={cn(
            "mt-5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
            dietActive ? "border-herb bg-herb text-herb-foreground" : "border-herb/40 bg-herb-soft text-secondary-foreground hover:border-herb",
          )}
        >
          <Leaf className="size-4" aria-hidden />
          My diet: {myDiet}
        </button>
      )}

      <nav aria-label="Categories" className="-mx-4 mt-8 overflow-x-auto px-4 scrollbar-none">
        <ul className="flex w-max gap-2">
          {[null, ...CATEGORY_SLUGS].map((slug) => {
            const active = filters.category === slug;
            return (
              <li key={slug ?? "all"}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilters({ category: slug })}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-glow"
                      : "bg-card shadow-xs hover:border-primary/40 hover:text-primary",
                  )}
                >
                  {slug ? CATEGORY_LABELS[slug] : "All recipes"}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-10 grid gap-10 lg:grid-cols-[250px_1fr] xl:gap-14">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2 pb-6 scrollbar-none">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-sans text-base font-semibold tracking-normal">Filters</h2>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Reset
                </button>
              )}
            </div>
            <RecipeFilters filters={filters} onChange={setFilters} facetSource={facetSource} idPrefix="desktop" />
          </div>
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="results-heading" className="font-sans text-base font-normal tracking-normal text-muted-foreground" aria-live="polite">
              <span className="font-semibold text-foreground">{results.length}</span>{" "}
              {results.length === 1 ? "recipe" : "recipes"}
              {filters.query && (
                <>
                  {" "}
                  for <span className="font-semibold text-foreground">“{filters.query}”</span>
                </>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-10 lg:hidden">
                    <SlidersHorizontal />
                    Filters
                    {activeCount > 0 && <Badge className="ml-0.5 h-5 min-w-5 px-1.5">{activeCount}</Badge>}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[88%] max-w-sm gap-0 p-0">
                  <SheetHeader className="border-b p-4">
                    <SheetTitle className="font-sans text-lg">Filters</SheetTitle>
                    <SheetDescription>Narrow down recipes to exactly what you want.</SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto p-5">
                    <RecipeFilters filters={filters} onChange={setFilters} facetSource={facetSource} idPrefix="mobile" />
                  </div>
                  <SheetFooter className="grid grid-cols-2 gap-2 border-t p-4">
                    <Button variant="outline" size="lg" onClick={clearAll}>
                      Reset
                    </Button>
                    <Button size="lg" onClick={() => setSheetOpen(false)}>
                      Show {results.length}
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              <SortSelect value={sort} onChange={setSort} />
            </div>
          </div>

          <div className="mt-4 empty:hidden">
            <ActiveFilterChips filters={filters} onChange={setFilters} onClear={clearAll} />
          </div>

          <div className="mt-8">
            {results.length > 0 ? (
              <>
                <RecipeGrid recipes={results.slice(0, visible)} columns={3} priorityCount={3} />
                {visible < results.length && (
                  <div className="mt-14 grid justify-items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      Showing {visible} of {results.length}
                    </p>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setPage({ key: filterKey, count: visible + PAGE_SIZE })}
                    >
                      Load more recipes
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={SearchX}
                title="No recipes match those filters"
                description="Try removing a filter or two, or search for something a little broader."
                actions={
                  <Button onClick={() => replaceFilters(emptyFilters)} size="lg">
                    Clear search & filters
                  </Button>
                }
              />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

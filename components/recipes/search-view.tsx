"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Carrot, CircleAlert, Search, SearchX } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/hooks/use-catalog";
import { CATEGORY_LABELS, CUISINE_LABELS } from "@/lib/labels";
import { DIETS, searchRecipes, sortRecipes } from "@/lib/recipes/query";
import type { Recipe } from "@/types/recipe";
import { RecipeGrid } from "./recipe-grid";
import { RecipeSearchForm } from "./recipe-search-form";

const SUGGESTIONS = ["Chicken", "Pasta", "Rice", "Vegetarian", "Desserts"];
const CHIP_TONES = ["brand", "amber", "coral", "berry", "ocean"] as const;
const MAX_QUERY_LENGTH = 80;

function setQueryInUrl(query: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  const next = params.toString();
  window.history.pushState(null, "", next ? `/search?${next}` : "/search");
}

export function SearchView({ recipes: serverRecipes }: { recipes: Recipe[] }) {
  const { recipes } = useCatalog(serverRecipes);
  const query = (useSearchParams().get("q") ?? "").trim();
  const tooLong = query.length > MAX_QUERY_LENGTH;

  const results = useMemo(
    () => (query && !tooLong ? searchRecipes(recipes, query) : []),
    [recipes, query, tooLong],
  );
  const popular = useMemo(() => sortRecipes(recipes, "featured").slice(0, 8), [recipes]);
  const suggestions = useMemo(
    () => [...new Set([...Object.values(CUISINE_LABELS), ...Object.values(CATEGORY_LABELS), ...DIETS, ...recipes.map((r) => r.title)])],
    [recipes],
  );

  const suggestionLinks = (
    <ul className="flex flex-wrap justify-center gap-2">
      {SUGGESTIONS.map((s, i) => (
        <li key={s} data-tone={CHIP_TONES[i % CHIP_TONES.length]}>
          <button
            type="button"
            onClick={() => setQueryInUrl(s.toLowerCase())}
            className="rounded-full border border-tone/25 bg-tone-soft px-4 py-1.5 text-sm font-semibold text-tone transition-all hover:-translate-y-0.5 hover:bg-tone hover:text-tone-foreground hover:shadow-soft"
          >
            {s}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader icon={<Search />} eyebrow="Find a recipe" title="Search">
        <div className="grid gap-5">
          <RecipeSearchForm
            key={query}
            defaultValue={query}
            onSearch={setQueryInUrl}
            autoFocus={!query}
            className="max-w-3xl"
            placeholder="Search titles, ingredients, cuisines, diets…"
            label="Search all recipes"
            suggestions={suggestions}
          />
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Have ingredients in mind?</span>
            <Link
              href="/ingredients"
              className="group inline-flex items-center gap-1.5 rounded-full bg-herb-soft px-3 py-1 font-semibold text-herb transition-colors hover:bg-herb hover:text-herb-foreground"
            >
              <Carrot className="size-4 transition-transform group-hover:-rotate-12" aria-hidden />
              Search by ingredients
            </Link>
          </div>
        </div>
      </PageHeader>

      <div className="container-page py-12 pb-24">
        {tooLong ? (
          <EmptyState
            icon={CircleAlert}
            title="That search is a little too long"
            description={`Try a shorter search — up to ${MAX_QUERY_LENGTH} characters, like a dish name or one or two ingredients.`}
            actions={
              <Button size="lg" onClick={() => setQueryInUrl("")}>
                Start a new search
              </Button>
            }
          />
        ) : !query ? (
          <section data-reveal suppressHydrationWarning aria-labelledby="featured-heading">
            <SectionHeading id="featured-heading" eyebrow="Handpicked" title="Featured recipes" />
            <RecipeGrid recipes={popular} />
          </section>
        ) : results.length > 0 ? (
          <section data-reveal suppressHydrationWarning aria-labelledby="results-count">
            <h2 id="results-count" aria-live="polite" className="mb-8 font-sans text-lg font-normal tracking-normal text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span>{" "}
              {results.length === 1 ? "recipe" : "recipes"} for{" "}
              <span className="font-semibold text-foreground">{query}</span>
            </h2>
            <RecipeGrid recipes={results} priorityCount={4} />
          </section>
        ) : (
          <EmptyState
            icon={SearchX}
            title="No recipes found."
            description={
              <>
                We couldn&apos;t find anything for <strong className="text-foreground">“{query}”</strong>. Check the
                spelling or try searching for:
              </>
            }
          >
            {suggestionLinks}
          </EmptyState>
        )}
      </div>
    </>
  );
}

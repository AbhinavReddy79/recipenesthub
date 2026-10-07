"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookHeart } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { RecipeGridSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/hooks/use-catalog";
import { useFavorites } from "@/hooks/use-favorites";
import { useHydrated } from "@/hooks/use-hydrated";
import { CUISINE_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { CuisineSlug, Recipe } from "@/types/recipe";
import { RecipeGrid } from "./recipe-grid";

export function SavedRecipesEmpty() {
  return (
    <EmptyState
      icon={BookHeart}
      title="Your cookbook is empty."
      description="Save recipes you love and they'll appear here. Tap the heart on any recipe to start."
      actions={
        <Button asChild size="lg">
          <Link href="/recipes">Explore Recipes</Link>
        </Button>
      }
    />
  );
}

export function SavedView({ recipes: serverRecipes }: { recipes: Recipe[] }) {
  const hydrated = useHydrated();
  const { slugs } = useFavorites();
  const { bySlug } = useCatalog(serverRecipes);
  const [cuisine, setCuisine] = useState<CuisineSlug | null>(null);

  const saved = useMemo(
    () => slugs.map((s) => bySlug.get(s)).filter((r): r is Recipe => Boolean(r)),
    [slugs, bySlug],
  );
  const cuisines = [...new Set(saved.map((r) => r.cuisine))];
  const shown = cuisine ? saved.filter((r) => r.cuisine === cuisine) : saved;

  if (!hydrated) return <RecipeGridSkeleton count={4} />;
  if (saved.length === 0) return <SavedRecipesEmpty />;

  return (
    <div data-reveal suppressHydrationWarning className="grid gap-8">
      {cuisines.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter saved recipes by cuisine">
          {[null, ...cuisines].map((c) => (
            <button
              key={c ?? "all"}
              type="button"
              aria-pressed={cuisine === c}
              onClick={() => setCuisine(c)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all",
                cuisine === c
                  ? "border-tone bg-tone text-tone-foreground shadow-soft"
                  : "bg-card shadow-xs hover:-translate-y-0.5 hover:border-tone/40 hover:text-tone",
              )}
            >
              {c ? CUISINE_LABELS[c] : `All (${saved.length})`}
            </button>
          ))}
        </div>
      )}
      <RecipeGrid recipes={shown} priorityCount={4} />
    </div>
  );
}

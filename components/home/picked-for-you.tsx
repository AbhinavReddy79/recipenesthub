"use client";

import { useMemo } from "react";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { RecipeGrid } from "@/components/recipes/recipe-grid";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/hooks/use-catalog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useSettings } from "@/hooks/use-settings";
import { CUISINE_LABELS } from "@/lib/labels";
import type { Recipe } from "@/types/recipe";

/** Recommendations driven by the dietary preference and favorite cuisines in Settings. */
export function PickedForYou({ recipes: serverRecipes }: { recipes: Recipe[] }) {
  const hydrated = useHydrated();
  const { preferences } = useSettings();
  const { recipes } = useCatalog(serverRecipes);
  const { user } = useCurrentUser();
  const { diet, favoriteCuisines } = preferences;

  const picks = useMemo(() => {
    const dietOk = (r: Recipe) => diet === "None" || r.diets.includes(diet);
    return recipes
      .filter(dietOk)
      .map((r) => ({ r, score: (favoriteCuisines.includes(r.cuisine) ? 10 : 0) + r.editorScore / 20000 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.r);
  }, [recipes, diet, favoriteCuisines]);

  const basis = [diet !== "None" ? diet : null, ...favoriteCuisines.map((c) => CUISINE_LABELS[c])].filter(Boolean);

  // Personal and only useful once preferences are set — otherwise it would repeat Editor's picks.
  if (!hydrated || !user || basis.length === 0) return null;

  return (
    <section data-reveal suppressHydrationWarning aria-labelledby="picked" className="container-page">
      <SectionHeading
        id="picked"
        eyebrow="Picked for you"
        title="Recipes that match your taste"
        description={
          basis.length
            ? `Based on your preferences: ${basis.join(" · ")}.`
            : "Tell us what you like to eat and we'll tailor this list."
        }
        action={
          <Button asChild variant="outline">
            <Link href="/settings#preferences">
              <SlidersHorizontal data-icon="inline-start" />
              Edit preferences
            </Link>
          </Button>
        }
      />
      <RecipeGrid recipes={picks} mobileCarousel />
    </section>
  );
}

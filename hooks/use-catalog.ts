import { useMemo } from "react";
import type { Recipe } from "@/types/recipe";
import { useUserRecipes } from "./use-user-recipes";

/**
 * Merges the built-in catalog with recipes the community has published, so
 * their creations show up everywhere.
 */
export function useCatalog(serverRecipes: Recipe[]) {
  const { published } = useUserRecipes();
  const recipes = useMemo(() => {
    const serverSlugs = new Set(serverRecipes.map((r) => r.slug));
    return [...published.filter((r) => !serverSlugs.has(r.slug)), ...serverRecipes];
  }, [published, serverRecipes]);
  const bySlug = useMemo(() => new Map(recipes.map((r) => [r.slug, r])), [recipes]);
  return { recipes, bySlug };
}

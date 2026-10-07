/**
 * Recipe data access. Every page reads recipes through these functions, so
 * swapping the mock catalog for a database or API only touches this file.
 */
import { recipes } from "@/data/recipes";
import { totalMinutes } from "@/lib/recipes/query";
import type { CuisineSlug, Recipe } from "@/types/recipe";

const published = () => recipes.filter((r) => r.status === "published");

export async function listRecipes(): Promise<Recipe[]> {
  return published();
}

export async function getRecipeBySlug(slug: string): Promise<Recipe | null> {
  return published().find((r) => r.slug === slug) ?? null;
}

export async function listRecipeSlugs(): Promise<string[]> {
  return published().map((r) => r.slug);
}

/** The RecipeNest kitchen's featured picks (editorial order, not user activity). */
export async function getFeaturedRecipes(limit = 8): Promise<Recipe[]> {
  return [...published()].sort((a, b) => b.editorScore - a.editorScore).slice(0, limit);
}

export async function getQuickRecipes(limit = 4): Promise<Recipe[]> {
  return published()
    .filter((r) => totalMinutes(r) <= 30 && r.mealType !== "Drink" && r.mealType !== "Dessert")
    .sort((a, b) => b.editorScore - a.editorScore)
    .slice(0, limit);
}


/** Tags that suit each time of year, used for the homepage "Seasonal ideas". */
const SEASONS = [
  { months: [11, 0, 1], title: "Warming winter cooking", tags: ["soup", "comfort", "curry", "baking", "chocolate", "lentils"] },
  { months: [2, 3, 4], title: "Fresh spring flavours", tags: ["vegetables", "lemon", "brunch", "salmon", "strawberry", "fish"] },
  { months: [5, 6, 7], title: "Easy summer meals", tags: ["summer", "grill", "tacos", "strawberry", "lemon", "seafood"] },
  { months: [8, 9, 10], title: "Cosy autumn favourites", tags: ["soup", "curry", "comfort", "baking", "lentils", "potato"] },
];

/** Catalog recipes whose tags suit the current time of year, best matches first. */
export async function getSeasonalRecipes(date = new Date(), limit = 5): Promise<{ title: string; recipes: Recipe[] }> {
  const season = SEASONS.find((s) => s.months.includes(date.getMonth())) ?? SEASONS[0];
  const matches = published()
    .map((r) => ({ r, score: (r.tags ?? []).filter((t) => season.tags.includes(t)).length }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.r.editorScore - a.r.editorScore)
    .slice(0, limit)
    .map((x) => x.r);
  return { title: season.title, recipes: matches };
}

/** Newest catalog recipes by publish date. */
export async function getRecentRecipes(limit = 4): Promise<Recipe[]> {
  return [...published()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}

export async function getRecipesByCuisine(cuisine: CuisineSlug): Promise<Recipe[]> {
  return published()
    .filter((r) => r.cuisine === cuisine)
    .sort((a, b) => b.editorScore - a.editorScore);
}

export async function getRelatedRecipes(recipe: Recipe, limit = 4): Promise<Recipe[]> {
  return published()
    .filter((r) => r.slug !== recipe.slug)
    .map((r) => ({
      r,
      score:
        (r.cuisine === recipe.cuisine ? 3 : 0) +
        r.categories.filter((c) => recipe.categories.includes(c)).length +
        (r.mealType === recipe.mealType ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || b.r.editorScore - a.r.editorScore)
    .slice(0, limit)
    .map((x) => x.r);
}

export async function countRecipesByCuisine(): Promise<Record<string, number>> {
  return published().reduce<Record<string, number>>((acc, r) => {
    acc[r.cuisine] = (acc[r.cuisine] ?? 0) + 1;
    return acc;
  }, {});
}

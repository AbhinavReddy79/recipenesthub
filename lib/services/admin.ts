/**
 * Admin data access for the official catalog. User accounts and user recipes
 * live in the browser for now, so the admin views read those client-side;
 * swap both for authenticated admin API calls when a backend exists.
 */
import { recipes } from "@/data/recipes";
import { cuisines } from "@/data/cuisines";
import { categories } from "@/data/categories";
import type { RecipeStatus } from "@/types/recipe";

export interface AdminRecipeRow {
  id: string;
  slug: string;
  title: string;
  image: string;
  authorName: string;
  cuisine: string;
  status: RecipeStatus;
  submittedAt: string;
  source: "platform" | "user";
}

export async function listCatalogRows(): Promise<AdminRecipeRow[]> {
  return recipes.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    image: r.image,
    authorName: r.author.name,
    cuisine: r.cuisine,
    status: r.status,
    submittedAt: r.createdAt,
    source: "platform" as const,
  }));
}

export async function getCatalogStats() {
  return { platformRecipes: recipes.length, cuisines: cuisines.length, categories: categories.length };
}

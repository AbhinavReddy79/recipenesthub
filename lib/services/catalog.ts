/** Taxonomy data access: categories and cuisines. */
import { categories } from "@/data/categories";
import { cuisines, featuredCuisineSlugs } from "@/data/cuisines";
import type { Category, Cuisine } from "@/types/recipe";

export async function listCategories(): Promise<Category[]> {
  return categories;
}


export async function listCuisines(): Promise<Cuisine[]> {
  return cuisines;
}

export async function listFeaturedCuisines(): Promise<Cuisine[]> {
  return featuredCuisineSlugs
    .map((slug) => cuisines.find((c) => c.slug === slug))
    .filter((c): c is Cuisine => Boolean(c));
}

export async function getCuisine(slug: string): Promise<Cuisine | null> {
  return cuisines.find((c) => c.slug === slug) ?? null;
}


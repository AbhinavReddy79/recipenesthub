import type { CategorySlug, CuisineSlug } from "@/types/recipe";

export const CUISINE_LABELS: Record<CuisineSlug, string> = {
  indian: "Indian",
  italian: "Italian",
  mexican: "Mexican",
  chinese: "Chinese",
  japanese: "Japanese",
  mediterranean: "Mediterranean",
  american: "American",
  korean: "Korean",
  thai: "Thai",
  vietnamese: "Vietnamese",
};

export const CATEGORY_LABELS: Record<CategorySlug, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  desserts: "Desserts",
  snacks: "Snacks",
  drinks: "Drinks",
  healthy: "Healthy",
  "quick-meals": "Quick Meals",
};

export const CUISINE_SLUGS = Object.keys(CUISINE_LABELS) as CuisineSlug[];
export const CATEGORY_SLUGS = Object.keys(CATEGORY_LABELS) as CategorySlug[];

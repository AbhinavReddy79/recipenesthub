import type {
  CategorySlug,
  CuisineSlug,
  Diet,
  Difficulty,
  Ingredient,
  MealType,
  Recipe,
  RecipeFilters,
  RecipeSort,
} from "@/types/recipe";

export const DIETS: Diet[] = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "High-Protein",
  "Low-Carb",
];
export const MEAL_TYPES: MealType[] = ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert", "Drink"];
export const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];
export const TIME_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: "Any time", value: null },
  { label: "Under 15 min", value: 15 },
  { label: "Under 30 min", value: 30 },
  { label: "Under 1 hour", value: 60 },
];
export const SORT_OPTIONS: Array<{ label: string; value: RecipeSort }> = [
  { label: "Featured", value: "featured" },
  { label: "Newest", value: "newest" },
  { label: "Quickest", value: "quickest" },
];

export const emptyFilters: RecipeFilters = {
  query: "",
  cuisines: [],
  diets: [],
  mealTypes: [],
  difficulties: [],
  maxMinutes: null,
  category: null,
};

export function totalMinutes(recipe: Pick<Recipe, "prepMinutes" | "cookMinutes">): number {
  return recipe.prepMinutes + recipe.cookMinutes;
}

function haystack(recipe: Recipe): string {
  return [
    recipe.title,
    recipe.description,
    recipe.cuisine,
    recipe.mealType,
    recipe.mealType === "Snack" ? "snacks" : "",
    recipe.state ?? "",
    recipe.region ?? "",
    ...recipe.categories.map((c) => c.replace("-", " ")),
    ...recipe.diets,
    ...(recipe.tags ?? []),
    ...recipe.ingredients.map((i) => i.name),
  ]
    .join(" ")
    .toLowerCase();
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);
}

/**
 * Full-text search across title, ingredients, cuisine, category and diet tags.
 * Every token must match; titles are weighted above other fields.
 */
export function searchRecipes(recipes: Recipe[], query: string): Recipe[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return recipes;

  return recipes
    .map((recipe) => {
      const text = haystack(recipe);
      const title = recipe.title.toLowerCase();
      let score = 0;
      for (const token of tokens) {
        // Match "desserts" against "dessert" and vice versa.
        const stem = token.replace(/(es|s)$/, "");
        if (!text.includes(token) && !text.includes(stem)) return null;
        if (title.includes(stem)) score += 5;
        if (recipe.ingredients.some((i) => i.name.toLowerCase().includes(stem))) score += 2;
        score += 1;
      }
      return { recipe, score };
    })
    .filter((entry): entry is { recipe: Recipe; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score || b.recipe.editorScore - a.recipe.editorScore)
    .map((entry) => entry.recipe);
}

export function filterRecipes(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
  const searched = filters.query ? searchRecipes(recipes, filters.query) : recipes;
  return searched.filter((recipe) => {
    if (filters.category && !recipe.categories.includes(filters.category)) return false;
    if (filters.cuisines.length && !filters.cuisines.includes(recipe.cuisine)) return false;
    if (filters.diets.length && !filters.diets.every((d) => recipe.diets.includes(d))) return false;
    if (filters.mealTypes.length && !filters.mealTypes.includes(recipe.mealType)) return false;
    if (filters.difficulties.length && !filters.difficulties.includes(recipe.difficulty)) return false;
    if (filters.maxMinutes !== null && totalMinutes(recipe) > filters.maxMinutes) return false;
    return true;
  });
}

export function sortRecipes(recipes: Recipe[], sort: RecipeSort): Recipe[] {
  const copy = [...recipes];
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "quickest":
      return copy.sort((a, b) => totalMinutes(a) - totalMinutes(b));
    case "featured":
    default:
      return copy.sort((a, b) => b.editorScore - a.editorScore);
  }
}

export function countActiveFilters(filters: RecipeFilters): number {
  return (
    filters.cuisines.length +
    filters.diets.length +
    filters.mealTypes.length +
    filters.difficulties.length +
    (filters.maxMinutes !== null ? 1 : 0) +
    (filters.category ? 1 : 0)
  );
}

/* ---------- URL <-> filters ---------- */

type ParamReader = { get(name: string): string | null };

function list<T extends string>(value: string | null, allowed: readonly T[]): T[] {
  if (!value) return [];
  const lowered = allowed.map((a) => a.toLowerCase());
  return value
    .split(",")
    .map((v) => allowed[lowered.indexOf(v.toLowerCase())])
    .filter((v): v is T => Boolean(v));
}

export function filtersFromParams(
  params: ParamReader,
  allCuisines: readonly CuisineSlug[],
  allCategories: readonly CategorySlug[],
): { filters: RecipeFilters; sort: RecipeSort } {
  const time = Number(params.get("time"));
  const category = params.get("category");
  const sort = params.get("sort");
  return {
    filters: {
      query: params.get("q") ?? "",
      cuisines: list(params.get("cuisine"), allCuisines),
      diets: list(params.get("diet"), DIETS),
      mealTypes: list(params.get("meal"), MEAL_TYPES),
      difficulties: list(params.get("difficulty"), DIFFICULTIES),
      maxMinutes: Number.isFinite(time) && time > 0 ? time : null,
      category: allCategories.find((c) => c === category) ?? null,
    },
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? (sort as RecipeSort) : "featured",
  };
}

export function filtersToParams(filters: RecipeFilters, sort: RecipeSort): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category) params.set("category", filters.category);
  if (filters.cuisines.length) params.set("cuisine", filters.cuisines.join(","));
  if (filters.diets.length) params.set("diet", filters.diets.join(","));
  if (filters.mealTypes.length) params.set("meal", filters.mealTypes.join(","));
  if (filters.difficulties.length) params.set("difficulty", filters.difficulties.join(","));
  if (filters.maxMinutes !== null) params.set("time", String(filters.maxMinutes));
  if (sort !== "featured") params.set("sort", sort);
  return params;
}

/* ---------- Ingredient matching ---------- */

const PANTRY_STAPLES = [
  "salt",
  "black pepper",
  "white pepper",
  "oil",
  "olive oil",
  "water",
  "cold water",
  "warm water",
  "ice",
  "sugar",
  "flaky salt",
  "oil for frying",
];

export function isPantryStaple(ingredient: Ingredient): boolean {
  return ingredient.aisle === "Spices" || PANTRY_STAPLES.includes(ingredient.name.toLowerCase());
}

/** Broad pantry terms mapped to the specific ingredients they cover. */
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  pasta: ["pasta", "spaghetti", "penne", "tagliatelle", "fettuccine"],
  noodles: ["noodles", "ramen noodles"],
  bread: ["bread", "brioche", "sourdough", "english muffin", "bun", "pita"],
  cheese: ["cheese", "mozzarella", "parmesan", "halloumi", "cotija", "mascarpone"],
  egg: ["egg", "egg yolk"],
  beef: ["beef", "ribeye", "sirloin", "brisket", "chuck"],
  fish: ["fish", "salmon", "cod"],
  milk: ["milk", "buttermilk"],
  chili: ["chili", "chilies", "chipotle"],
  tortilla: ["tortilla"],
};

export function ingredientMatches(ingredientName: string, term: string): boolean {
  const key = term.toLowerCase().trim();
  const terms = INGREDIENT_SYNONYMS[key] ?? [key];
  return terms.some((t) => {
    const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}(s|es)?\\b`, "i").test(ingredientName);
  });
}

export interface IngredientMatch {
  recipe: Recipe;
  percent: number;
  matched: Ingredient[];
  missing: Ingredient[];
}

export function matchRecipesByIngredients(
  recipes: Recipe[],
  selected: string[],
  assumePantry: boolean,
): IngredientMatch[] {
  if (selected.length === 0) return [];
  return recipes
    .map((recipe) => {
      const pantry = assumePantry ? recipe.ingredients.filter(isPantryStaple) : [];
      const relevant = recipe.ingredients.filter((i) => !pantry.includes(i));
      const matched = relevant.filter((i) => selected.some((term) => ingredientMatches(i.name, term)));
      const missing = relevant.filter((i) => !matched.includes(i));
      const percent = Math.round(
        ((matched.length + pantry.length) / Math.max(recipe.ingredients.length, 1)) * 100,
      );
      return { recipe, percent, matched, missing };
    })
    .filter((m) => m.matched.length > 0)
    .sort((a, b) => b.percent - a.percent || b.matched.length - a.matched.length);
}

/* ---------- Servings ---------- */

export function scaleQuantity(
  quantity: number | null,
  baseServings: number,
  servings: number,
): number | null {
  if (quantity === null) return null;
  return (quantity * servings) / Math.max(baseServings, 1);
}

import { createId, slugify } from "@/lib/utils";
import type {
  CategorySlug,
  CuisineSlug,
  Diet,
  Difficulty,
  IngredientAisle,
  MealType,
  Recipe,
  RecipeStatus,
} from "@/types/recipe";
import type { UserProfile } from "@/types/user";

/** Form-friendly recipe shape: numbers are strings while being edited. */
export interface RecipeDraft {
  title: string;
  description: string;
  image: string;
  cuisine: CuisineSlug | "";
  category: CategorySlug | "";
  mealType: MealType | "";
  difficulty: Difficulty | "";
  ingredients: Array<{ id: string; quantity: string; unit: string; name: string; aisle: IngredientAisle }>;
  steps: Array<{ id: string; text: string }>;
  prepMinutes: string;
  cookMinutes: string;
  servings: string;
  diets: Diet[];
  /** Comma-separated tags, e.g. "weeknight, one-pot". */
  tags: string;
  nutrition: { calories: string; protein: string; carbs: string; fat: string };
}

export const UNITS = ["", "g", "kg", "ml", "l", "tsp", "tbsp", "cup", "oz", "lb", "clove", "pinch", "slice", "can", "bunch"];
export const AISLES: IngredientAisle[] = ["Produce", "Dairy", "Meat", "Grains", "Spices", "Other"];

export const newIngredient = (): RecipeDraft["ingredients"][number] => ({
  id: createId("ing"),
  quantity: "",
  unit: "",
  name: "",
  aisle: "Produce",
});
export const newStep = (): RecipeDraft["steps"][number] => ({ id: createId("step"), text: "" });

export function emptyDraft(): RecipeDraft {
  return {
    title: "",
    description: "",
    image: "",
    cuisine: "",
    category: "",
    mealType: "",
    difficulty: "",
    ingredients: [newIngredient(), newIngredient(), newIngredient()],
    steps: [newStep(), newStep()],
    prepMinutes: "",
    cookMinutes: "",
    servings: "2",
    diets: [],
    tags: "",
    nutrition: { calories: "", protein: "", carbs: "", fat: "" },
  };
}

/** Parses "1 1/2", "1/2", "1.5" or "" into a number (or null). */
export function parseQuantity(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  const mixed = v.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = v.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function draftFromRecipe(recipe: Recipe): RecipeDraft {
  return {
    title: recipe.title,
    description: recipe.description,
    image: recipe.image,
    cuisine: recipe.cuisine,
    category: recipe.categories[0] ?? "",
    mealType: recipe.mealType,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients.map((i) => ({
      id: i.id,
      quantity: i.quantity === null ? "" : String(Math.round(i.quantity * 100) / 100),
      unit: i.unit,
      name: i.name + (i.note ? `, ${i.note}` : ""),
      aisle: i.aisle,
    })),
    steps: recipe.steps.map((s) => ({ id: s.id, text: s.text })),
    prepMinutes: String(recipe.prepMinutes),
    cookMinutes: String(recipe.cookMinutes),
    servings: String(recipe.servings),
    diets: recipe.diets,
    tags: (recipe.tags ?? []).join(", "),
    nutrition: {
      calories: String(recipe.nutrition.calories),
      protein: String(recipe.nutrition.protein),
      carbs: String(recipe.nutrition.carbs),
      fat: String(recipe.nutrition.fat),
    },
  };
}

/** "Weeknight, one-pot ,Spicy" → ["weeknight", "one-pot", "spicy"] (unique, max 8). */
export function parseTags(value: string): string[] {
  const tags = value
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
    .filter((t) => t.length > 0 && t.length <= 24);
  return [...new Set(tags)].slice(0, 8);
}

/** Loose shape check for a draft restored from storage. */
export function isRecipeDraft(value: unknown): value is RecipeDraft {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<RecipeDraft>;
  return typeof v.title === "string" && Array.isArray(v.ingredients) && Array.isArray(v.steps) && typeof v.nutrition === "object";
}

const int = (value: string) => Math.max(0, Math.round(Number(value) || 0));

export function draftToRecipe(
  draft: RecipeDraft,
  options: { status: RecipeStatus; existing?: Recipe; profile: UserProfile },
): Recipe {
  const { existing, profile, status } = options;
  const slug = existing?.slug ?? `${slugify(draft.title) || "recipe"}-${createId("").slice(1, 6)}`;
  return {
    id: existing?.id ?? slug,
    slug,
    title: draft.title.trim() || "Untitled recipe",
    description: draft.description.trim(),
    image: draft.image,
    cuisine: draft.cuisine || "american",
    categories: draft.category ? [draft.category] : [],
    mealType: draft.mealType || "Dinner",
    difficulty: draft.difficulty || "Easy",
    diets: draft.diets,
    prepMinutes: int(draft.prepMinutes),
    cookMinutes: int(draft.cookMinutes),
    servings: Math.max(1, int(draft.servings)),
    ingredients: draft.ingredients
      .filter((i) => i.name.trim())
      .map((i) => {
        const q = parseQuantity(i.quantity);
        return {
          id: i.id,
          quantity: q === null || Number.isNaN(q) ? null : q,
          unit: i.unit,
          name: i.name.trim(),
          aisle: i.aisle,
        };
      }),
    steps: draft.steps.filter((s) => s.text.trim()).map((s) => ({ id: s.id, text: s.text.trim() })),
    nutrition: {
      calories: int(draft.nutrition.calories),
      protein: int(draft.nutrition.protein),
      carbs: int(draft.nutrition.carbs),
      fat: int(draft.nutrition.fat),
    },
    editorScore: 0,
    authorId: existing?.authorId ?? profile.id,
    author: { id: profile.id, name: profile.name, username: profile.username, avatar: profile.avatar },
    createdAt: existing?.createdAt ?? new Date().toISOString().slice(0, 10),
    status,
    tags: parseTags(draft.tags),
  };
}

export type StepErrors = Record<string, string>;

/** Validates one form step. Keys are field ids so errors can be shown inline. */
export function validateDraftStep(step: number, draft: RecipeDraft): StepErrors {
  const errors: StepErrors = {};
  if (step === 0) {
    if (draft.title.trim().length < 3) errors.title = "Give your recipe a title (at least 3 characters).";
    if (draft.title.trim().length > 80) errors.title = "Keep the title under 80 characters.";
    if (draft.description.trim().length < 20) errors.description = "Add a short description — at least 20 characters.";
    if (!draft.image) errors.image = "Add a photo so your recipe stands out.";
    if (!draft.cuisine) errors.cuisine = "Choose a cuisine.";
    if (!draft.category) errors.category = "Choose a category.";
    if (!draft.mealType) errors.mealType = "Choose a meal type.";
    if (!draft.difficulty) errors.difficulty = "Choose a difficulty.";
  }
  if (step === 1) {
    const filled = draft.ingredients.filter((i) => i.name.trim());
    if (filled.length < 2) errors.ingredients = "Add at least two ingredients.";
    draft.ingredients.forEach((i) => {
      const q = parseQuantity(i.quantity);
      if (i.quantity.trim() && (q === null || Number.isNaN(q) || q <= 0)) {
        errors[`qty-${i.id}`] = "Use a number like 2, 0.5 or 1 1/2.";
      }
      if (!i.name.trim() && (i.quantity.trim() || i.unit)) errors[`name-${i.id}`] = "Name this ingredient or remove the row.";
    });
  }
  if (step === 2) {
    const filled = draft.steps.filter((s) => s.text.trim());
    if (filled.length < 2) errors.steps = "Add at least two instruction steps.";
    draft.steps.forEach((s) => {
      if (s.text.trim() && s.text.trim().length < 8) errors[`step-${s.id}`] = "Describe this step in a little more detail.";
    });
  }
  if (step === 3) {
    const prep = Number(draft.prepMinutes);
    const cook = Number(draft.cookMinutes);
    const servings = Number(draft.servings);
    if (draft.prepMinutes === "" || !Number.isFinite(prep) || prep < 0) errors.prepMinutes = "Enter prep time in minutes.";
    if (draft.cookMinutes === "" || !Number.isFinite(cook) || cook < 0) errors.cookMinutes = "Enter cook time (0 for no-cook).";
    if (!Number.isInteger(servings) || servings < 1 || servings > 48) errors.servings = "Servings must be between 1 and 48.";
    (["calories", "protein", "carbs", "fat"] as const).forEach((k) => {
      const v = draft.nutrition[k];
      if (v !== "" && (!Number.isFinite(Number(v)) || Number(v) < 0)) errors[`nutrition-${k}`] = "Must be a positive number.";
    });
  }
  return errors;
}

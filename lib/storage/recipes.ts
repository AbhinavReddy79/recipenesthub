import { FALLBACK_RECIPE_IMAGE } from "@/lib/images";
import type { Database } from "@/lib/supabase/database.types";
import type { RecipeNestClient } from "@/lib/supabase/client";
import { getSupabase } from "@/lib/supabase/client";
import { BUCKETS } from "@/lib/supabase/env";
import type { Difficulty, IngredientAisle, MealType, Nutrition, Recipe } from "@/types/recipe";
import { PUBLIC_PROFILE_COLUMNS, toProfile } from "./accounts";
import { createMemoryStore, isRecord, readJSON, removeKey, STORAGE_PREFIX, writeJSON } from "./core";
import { isDataUrl, reportError, safeImageUrl, uploadImage, userContext } from "./remote";
import { getActiveUserId } from "./session";

const AISLES: IngredientAisle[] = ["Produce", "Dairy", "Meat", "Grains", "Spices", "Other"];

const RECIPE_SELECT = `*, author:profiles!recipes_author_id_fkey(${PUBLIC_PROFILE_COLUMNS}), recipe_ingredients(*), recipe_steps(*)` as const;

type RecipeRow = Database["public"]["Tables"]["recipes"]["Row"];
type IngredientRow = Database["public"]["Tables"]["recipe_ingredients"]["Row"];
type StepRow = Database["public"]["Tables"]["recipe_steps"]["Row"];

function toNutrition(value: unknown): Nutrition {
  const n = isRecord(value) ? value : {};
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
  return {
    calories: num(n.calories),
    protein: num(n.protein),
    carbs: num(n.carbs),
    fat: num(n.fat),
    ...(typeof n.fiber === "number" ? { fiber: n.fiber } : {}),
    ...(typeof n.sugar === "number" ? { sugar: n.sugar } : {}),
  };
}

function fromRow(
  row: RecipeRow & {
    author: Parameters<typeof toProfile>[0] | null;
    recipe_ingredients: IngredientRow[];
    recipe_steps: StepRow[];
  },
): Recipe | null {
  if (!row.author) return null;
  const author = toProfile(row.author);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    image: safeImageUrl(row.image_url, BUCKETS.recipeImages) || FALLBACK_RECIPE_IMAGE,
    cuisine: row.cuisine as Recipe["cuisine"],
    categories: row.categories as Recipe["categories"],
    mealType: row.meal_type as MealType,
    difficulty: row.difficulty as Difficulty,
    diets: row.diets as Recipe["diets"],
    prepMinutes: row.prep_minutes,
    cookMinutes: row.cook_minutes,
    servings: row.servings,
    ingredients: [...row.recipe_ingredients]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        id: i.id,
        quantity: i.quantity === null ? null : Number(i.quantity),
        unit: i.unit,
        name: i.name,
        ...(i.note ? { note: i.note } : {}),
        aisle: AISLES.includes(i.aisle as IngredientAisle) ? (i.aisle as IngredientAisle) : "Other",
      })),
    steps: [...row.recipe_steps]
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ id: s.id, text: s.text, ...(s.timer_minutes ? { timerMinutes: s.timer_minutes } : {}) })),
    nutrition: toNutrition(row.nutrition),
    // Community recipes are never part of the editorial ranking.
    editorScore: 0,
    authorId: row.author_id,
    author: { id: author.id, name: author.name, username: author.username, avatar: author.avatar },
    createdAt: row.created_at,
    status: row.status,
    tags: row.tags,
  };
}

/**
 * Community recipes the current visitor may see: everyone's published recipes,
 * plus the signed-in author's own drafts (and every recipe, for admins).
 */
export const userRecipesStore = createMemoryStore<Recipe[]>([]);

async function load(client?: RecipeNestClient): Promise<void> {
  const supabase = client ?? getSupabase();
  if (!supabase) return;
  const { data, error } = await supabase.from("recipes").select(RECIPE_SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  userRecipesStore.set(data.flatMap((row) => fromRow(row) ?? []));
}

export type SaveRecipeResult = { ok: true; recipe: Recipe } | { ok: false; error: string };

export const recipesStorage = {
  load,
  find: (id: string) => userRecipesStore.get().find((r) => r.id === id) ?? null,

  /** Creates or updates one of the signed-in user's recipes; a newly picked photo is uploaded first. */
  async save(recipe: Recipe): Promise<SaveRecipeResult> {
    const ctx = userContext();
    if (!ctx) return { ok: false, error: "Please log in again to save your recipe." };
    const { supabase, userId } = ctx;

    let imageUrl = recipe.image;
    if (isDataUrl(imageUrl)) {
      try {
        imageUrl = await uploadImage(supabase, BUCKETS.recipeImages, `${userId}/${recipe.id}-${Date.now()}.jpg`, imageUrl);
      } catch (error) {
        console.error(error);
        return { ok: false, error: "We couldn't upload your photo. Try a smaller JPG or PNG." };
      }
    }

    const { error: recipeError } = await supabase.from("recipes").upsert(
      {
        id: recipe.id,
        slug: recipe.slug,
        author_id: userId,
        title: recipe.title,
        description: recipe.description,
        image_url: imageUrl,
        cuisine: recipe.cuisine,
        categories: recipe.categories,
        meal_type: recipe.mealType,
        difficulty: recipe.difficulty,
        diets: recipe.diets,
        prep_minutes: recipe.prepMinutes,
        cook_minutes: recipe.cookMinutes,
        servings: recipe.servings,
        nutrition: { ...recipe.nutrition },
        tags: recipe.tags ?? [],
        status: recipe.status === "draft" ? "draft" : "published",
      },
      { onConflict: "id" },
    );
    if (recipeError) {
      console.error(recipeError);
      return { ok: false, error: "We couldn't save your recipe. Please try again." };
    }

    // Ingredients and steps are replaced as a whole on every save.
    const cleared = await Promise.all([
      supabase.from("recipe_ingredients").delete().eq("recipe_id", recipe.id),
      supabase.from("recipe_steps").delete().eq("recipe_id", recipe.id),
    ]);
    const inserted = await Promise.all([
      recipe.ingredients.length
        ? supabase.from("recipe_ingredients").insert(
            recipe.ingredients.map((i, position) => ({
              recipe_id: recipe.id,
              position,
              quantity: i.quantity,
              unit: i.unit,
              name: i.name,
              note: i.note ?? null,
              aisle: i.aisle,
            })),
          )
        : { error: null },
      recipe.steps.length
        ? supabase.from("recipe_steps").insert(
            recipe.steps.map((s, position) => ({
              recipe_id: recipe.id,
              position,
              text: s.text,
              timer_minutes: s.timerMinutes ?? null,
            })),
          )
        : { error: null },
    ]);
    const stepError = [...cleared, ...inserted].find((r) => r.error)?.error;
    if (stepError) {
      console.error(stepError);
      return { ok: false, error: "Your recipe was saved, but some ingredients or steps weren't. Please save it again." };
    }

    await load(supabase).catch((error: unknown) => reportError("refresh recipes", error));
    const saved = recipesStorage.find(recipe.id) ?? { ...recipe, image: imageUrl };
    return { ok: true, recipe: saved };
  },

  /**
   * Deletes a recipe. The database also removes it from everyone's saved
   * recipes, collections, meal plans and reviews.
   */
  async remove(id: string): Promise<boolean> {
    const ctx = userContext();
    if (!ctx) return false;
    const { error } = await ctx.supabase.from("recipes").delete().eq("id", id);
    if (error) {
      reportError("delete that recipe", error);
      return false;
    }
    userRecipesStore.set((prev) => prev.filter((r) => r.id !== id));
    return true;
  },

  /** Admin moderation: publish or unpublish someone's recipe. */
  setStatus(id: string, status: Recipe["status"]) {
    const ctx = userContext();
    if (!ctx) return;
    userRecipesStore.set((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    void ctx.supabase
      .from("recipes")
      .update({ status })
      .eq("id", id)
      .then(({ error }) => {
        if (!error) return;
        reportError("update that recipe", error);
        void load(ctx.supabase).catch(() => {});
      });
  },
};

/* ---------- Unsaved create-form progress (this browser, per user) ---------- */

const autosaveKey = () => {
  const userId = getActiveUserId();
  return userId ? `${STORAGE_PREFIX}u:${userId}:recipe-form-autosave` : null;
};

export const recipeFormAutosave = {
  load<T>(isValid: (value: unknown) => value is T): T | null {
    const key = autosaveKey();
    const value = key ? readJSON(key) : undefined;
    return isValid(value) ? value : null;
  },
  save(value: unknown) {
    const key = autosaveKey();
    if (key) writeJSON(key, value);
  },
  clear() {
    const key = autosaveKey();
    if (key) removeKey(key);
  },
};

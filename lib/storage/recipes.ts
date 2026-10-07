import type { Recipe } from "@/types/recipe";
import { collectionsStorage } from "./collections";
import { reviewsStorage } from "./reviews";
import {
  arrayOf,
  createPersistentStore,
  getActiveUserId,
  isRecord,
  isString,
  readJSON,
  removeKey,
  userKeyPrefix,
  writeJSON,
} from "./core";
import { favoritesStorage } from "./favorites";
import { mealPlanStorage } from "./mealPlanner";

const isRecipe = (value: unknown): value is Recipe =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.slug) &&
  isString(value.title) &&
  isString(value.authorId) &&
  Array.isArray(value.ingredients) &&
  Array.isArray(value.steps) &&
  isRecord(value.nutrition) &&
  isRecord(value.author);

/**
 * Recipes written by people on this device. Published ones are the community;
 * drafts are only shown to their author. Starts empty — nothing is seeded.
 */
export const userRecipesStore = createPersistentStore<Recipe[]>(
  "community-recipes",
  [],
  (value) =>
    arrayOf(isRecipe)(value)?.map((r) => ({
      ...r,
      categories: Array.isArray(r.categories) ? r.categories : [],
      diets: Array.isArray(r.diets) ? r.diets : [],
      tags: Array.isArray(r.tags) ? r.tags : [],
      editorScore: 0,
      status: r.status === "draft" ? "draft" : "published",
    })) ?? null,
);

export const recipesStorage = {
  find: (id: string) => userRecipesStore.get().find((r) => r.id === id) ?? null,
  /** Inserts or replaces a recipe by id. */
  save(recipe: Recipe) {
    userRecipesStore.set((prev) =>
      prev.some((r) => r.id === recipe.id) ? prev.map((r) => (r.id === recipe.id ? recipe : r)) : [recipe, ...prev],
    );
  },
  /** Deletes a recipe and removes it from the current user's saved recipes, collections and meal plan. */
  remove(id: string) {
    const recipe = recipesStorage.find(id);
    userRecipesStore.set((prev) => prev.filter((r) => r.id !== id));
    if (!recipe) return;
    favoritesStorage.remove(recipe.slug);
    collectionsStorage.purgeRecipe(recipe.slug);
    mealPlanStorage.purgeRecipe(recipe.slug);
    reviewsStorage.removeByRecipe(recipe.slug);
  },
  removeByAuthor(authorId: string) {
    userRecipesStore.set((prev) => prev.filter((r) => r.authorId !== authorId));
  },
  setStatus(id: string, status: Recipe["status"]) {
    userRecipesStore.set((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  },
};

/* ---------- Unsaved create-form progress (per user) ---------- */

const autosaveKey = () => {
  const userId = getActiveUserId();
  return userId ? `${userKeyPrefix(userId)}recipe-form-autosave` : null;
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

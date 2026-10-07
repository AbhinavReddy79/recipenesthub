import { createId } from "@/lib/utils";
import { REVIEW_TEXT_MAX, type Review } from "@/types/review";
import { createPersistentStore, getActiveUserId, isRecord, isString } from "./core";

function sanitizeReview(value: unknown): Review | null {
  if (!isRecord(value)) return null;
  const rating = Number(value.rating);
  if (!isString(value.id) || !isString(value.recipeSlug) || !isString(value.authorId) || !isString(value.createdAt)) return null;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return null;
  return {
    id: value.id,
    recipeSlug: value.recipeSlug,
    authorId: value.authorId,
    rating,
    text: isString(value.text) ? value.text.slice(0, REVIEW_TEXT_MAX) : "",
    createdAt: value.createdAt,
    ...(isString(value.updatedAt) ? { updatedAt: value.updatedAt } : {}),
  };
}

/**
 * Reviews from every profile on this browser, so cooks sharing a device see
 * each other's ratings. Starts empty — there are no seeded reviews.
 */
export const reviewsStore = createPersistentStore<Review[]>("reviews", [], (value) =>
  Array.isArray(value) ? value.map(sanitizeReview).filter((r): r is Review => r !== null) : null,
);

export const reviewsStorage = {
  /** Creates or updates the signed-in user's review of a recipe (one per recipe). */
  save(recipeSlug: string, input: { rating: number; text: string }) {
    const authorId = getActiveUserId();
    if (!authorId) return;
    const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
    const text = input.text.trim().slice(0, REVIEW_TEXT_MAX);
    const now = new Date().toISOString();
    reviewsStore.set((prev) => {
      const existing = prev.find((r) => r.recipeSlug === recipeSlug && r.authorId === authorId);
      if (existing) return prev.map((r) => (r.id === existing.id ? { ...r, rating, text, updatedAt: now } : r));
      return [{ id: createId("rev"), recipeSlug, authorId, rating, text, createdAt: now }, ...prev];
    });
  },
  /** Removes a review written by the signed-in user. */
  remove(id: string) {
    const authorId = getActiveUserId();
    reviewsStore.set((prev) => prev.filter((r) => !(r.id === id && r.authorId === authorId)));
  },
  removeByAuthor(authorId: string) {
    reviewsStore.set((prev) => prev.filter((r) => r.authorId !== authorId));
  },
  removeByRecipe(recipeSlug: string) {
    reviewsStore.set((prev) => prev.filter((r) => r.recipeSlug !== recipeSlug));
  },
};

/** Recipes the signed-in user finished in cooking mode: slug → when. */
export const cookedStore = createPersistentStore<Record<string, string>>(
  "cooked",
  {},
  (value) => (isRecord(value) ? Object.fromEntries(Object.entries(value).filter((e): e is [string, string] => isString(e[1]))) : null),
  "user",
);

export const cookedStorage = {
  markCooked(recipeSlug: string) {
    cookedStore.set((prev) => ({ ...prev, [recipeSlug]: new Date().toISOString() }));
  },
};

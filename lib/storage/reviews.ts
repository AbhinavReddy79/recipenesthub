import type { RecipeNestClient } from "@/lib/supabase/client";
import { getSupabase } from "@/lib/supabase/client";
import { REVIEW_TEXT_MAX, type Review } from "@/types/review";
import type { UserProfile } from "@/types/user";
import { PUBLIC_PROFILE_COLUMNS, toProfile } from "./accounts";
import { createMemoryStore } from "./core";
import { persist, reportError, userContext } from "./remote";

export interface ReviewWithAuthor extends Review {
  author: UserProfile;
}

export interface RatingTotals {
  count: number;
  average: number;
}

/** Average rating per recipe slug, from real reviews only (recipe_ratings view). */
export const ratingsStore = createMemoryStore<Record<string, RatingTotals>>({});

/** Reviews of recipes whose pages have been opened, newest first. */
export const reviewsBySlugStore = createMemoryStore<Record<string, ReviewWithAuthor[]>>({});

/** Every review, newest first (admin console only; filled by loadAllReviews). */
export const allReviewsStore = createMemoryStore<ReviewWithAuthor[]>([]);

/** Recipes the signed-in user finished in cooking mode: slug → when. */
export const cookedStore = createMemoryStore<Record<string, string>>({});

export async function loadRatings(supabase: RecipeNestClient): Promise<void> {
  const { data, error } = await supabase.from("recipe_ratings").select("recipe_slug, review_count, average_rating");
  if (error) throw error;
  ratingsStore.set(
    Object.fromEntries(data.map((row) => [row.recipe_slug, { count: row.review_count, average: row.average_rating }])),
  );
}

async function refreshRating(supabase: RecipeNestClient, recipeSlug: string): Promise<void> {
  const { data } = await supabase
    .from("recipe_ratings")
    .select("review_count, average_rating")
    .eq("recipe_slug", recipeSlug)
    .maybeSingle();
  ratingsStore.set((prev) => {
    const next = { ...prev };
    if (data) next[recipeSlug] = { count: data.review_count, average: data.average_rating };
    else delete next[recipeSlug];
    return next;
  });
}

const inflight = new Set<string>();

const REVIEW_COLUMNS = `id, recipe_slug, author_id, rating, text, created_at, updated_at, moderated_at, author:profiles!reviews_author_id_fkey(${PUBLIC_PROFILE_COLUMNS})`;

type ReviewRow = {
  id: string;
  recipe_slug: string;
  author_id: string;
  rating: number;
  text: string;
  created_at: string;
  updated_at: string | null;
  moderated_at: string | null;
  author: Parameters<typeof toProfile>[0] | null;
};

function fromRow(row: ReviewRow): ReviewWithAuthor[] {
  if (!row.author) return [];
  return [
    {
      id: row.id,
      recipeSlug: row.recipe_slug,
      authorId: row.author_id,
      rating: row.rating,
      text: row.text,
      createdAt: row.created_at,
      ...(row.updated_at ? { updatedAt: row.updated_at } : {}),
      ...(row.moderated_at ? { moderatedAt: row.moderated_at } : {}),
      author: toProfile(row.author),
    },
  ];
}

/** Loads the reviews for one recipe (with each author's public profile). */
export async function loadReviews(recipeSlug: string, { force = false } = {}): Promise<void> {
  const supabase = getSupabase();
  if (!supabase || (!force && (inflight.has(recipeSlug) || reviewsBySlugStore.get()[recipeSlug]))) return;
  inflight.add(recipeSlug);
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(REVIEW_COLUMNS)
      .eq("recipe_slug", recipeSlug)
      .order("created_at", { ascending: false });
    if (error) throw error;
    const reviews = (data as ReviewRow[]).flatMap(fromRow);
    reviewsBySlugStore.set((prev) => ({ ...prev, [recipeSlug]: reviews }));
  } catch (error) {
    reportError("load reviews", error);
  } finally {
    inflight.delete(recipeSlug);
  }
}

/** Admin console: every review on the site, newest first. */
export async function loadAllReviews(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  const { data, error } = await supabase.from("reviews").select(REVIEW_COLUMNS).order("created_at", { ascending: false }).limit(1000);
  if (error) return reportError("load reviews", error);
  allReviewsStore.set((data as ReviewRow[]).flatMap(fromRow));
}

async function afterReviewChange(supabase: RecipeNestClient, recipeSlug: string) {
  await Promise.all([
    loadReviews(recipeSlug, { force: true }),
    refreshRating(supabase, recipeSlug),
    allReviewsStore.get().length ? loadAllReviews() : Promise.resolve(),
  ]);
}

export const reviewsStorage = {
  /** Creates or updates the signed-in user's review of a recipe (one per recipe). */
  save(recipeSlug: string, input: { rating: number; text: string }) {
    const ctx = userContext();
    if (!ctx) return;
    const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
    const text = input.text.trim().slice(0, REVIEW_TEXT_MAX);
    const existing = reviewsBySlugStore.get()[recipeSlug]?.find((r) => r.authorId === ctx.userId);
    const request = existing
      ? ctx.supabase.from("reviews").update({ rating, text, updated_at: new Date().toISOString() }).eq("id", existing.id)
      : ctx.supabase.from("reviews").insert({ recipe_slug: recipeSlug, author_id: ctx.userId, rating, text });
    persist(
      "save your review",
      Promise.resolve(request).then(async (result) => {
        await afterReviewChange(ctx.supabase, recipeSlug);
        return result;
      }),
    );
  },
  /** Removes a review written by the signed-in user. */
  remove(id: string) {
    const ctx = userContext();
    if (!ctx) return;
    const slug = Object.entries(reviewsBySlugStore.get()).find(([, list]) => list.some((r) => r.id === id))?.[0];
    reviewsBySlugStore.set((prev) =>
      Object.fromEntries(Object.entries(prev).map(([key, list]) => [key, list.filter((r) => r.id !== id)])),
    );
    persist(
      "delete your review",
      Promise.resolve(ctx.supabase.from("reviews").delete().eq("id", id).eq("author_id", ctx.userId)).then(async (result) => {
        if (slug) await afterReviewChange(ctx.supabase, slug);
        return result;
      }),
    );
  },
};

/**
 * Admin moderation: edit or delete anyone's review. The database decides who
 * may (admins, but never on the owner's reviews) and marks edits as moderated.
 */
export const reviewModeration = {
  edit(review: Pick<ReviewWithAuthor, "id" | "recipeSlug">, input: { rating: number; text: string }) {
    const ctx = userContext();
    if (!ctx) return;
    const rating = Math.min(5, Math.max(1, Math.round(input.rating)));
    const text = input.text.trim().slice(0, REVIEW_TEXT_MAX);
    const patch = (r: ReviewWithAuthor): ReviewWithAuthor =>
      r.id === review.id ? { ...r, rating, text, moderatedAt: new Date().toISOString() } : r;
    allReviewsStore.set((prev) => prev.map(patch));
    reviewsBySlugStore.set((prev) => ({ ...prev, [review.recipeSlug]: (prev[review.recipeSlug] ?? []).map(patch) }));
    persist(
      "update that review",
      Promise.resolve(
        ctx.supabase.from("reviews").update({ rating, text, updated_at: new Date().toISOString() }).eq("id", review.id).select("id"),
      ).then(async (result) => {
        await afterReviewChange(ctx.supabase, review.recipeSlug);
        // RLS hides rows you may not edit: no row back means it wasn't allowed.
        if (!result.error && !result.data?.length) return { error: new Error("You can't edit this review.") };
        return result;
      }),
    );
  },
  remove(review: Pick<ReviewWithAuthor, "id" | "recipeSlug">) {
    const ctx = userContext();
    if (!ctx) return;
    allReviewsStore.set((prev) => prev.filter((r) => r.id !== review.id));
    reviewsBySlugStore.set((prev) => ({ ...prev, [review.recipeSlug]: (prev[review.recipeSlug] ?? []).filter((r) => r.id !== review.id) }));
    persist(
      "delete that review",
      Promise.resolve(ctx.supabase.from("reviews").delete().eq("id", review.id).select("id")).then(async (result) => {
        await afterReviewChange(ctx.supabase, review.recipeSlug);
        if (!result.error && !result.data?.length) return { error: new Error("You can't delete this review.") };
        return result;
      }),
    );
  },
};

export async function loadCooked(supabase: RecipeNestClient, userId: string): Promise<void> {
  const { data, error } = await supabase.from("cooked_log").select("recipe_slug, cooked_at").eq("user_id", userId);
  if (error) throw error;
  cookedStore.set(Object.fromEntries(data.map((row) => [row.recipe_slug, row.cooked_at])));
}

export const cookedStorage = {
  markCooked(recipeSlug: string) {
    const ctx = userContext();
    if (!ctx) return;
    const cookedAt = new Date().toISOString();
    cookedStore.set((prev) => ({ ...prev, [recipeSlug]: cookedAt }));
    persist(
      "save your cooking history",
      ctx.supabase.from("cooked_log").upsert({ user_id: ctx.userId, recipe_slug: recipeSlug, cooked_at: cookedAt }, { onConflict: "user_id,recipe_slug" }),
    );
  },
};

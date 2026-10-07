import { useEffect, useMemo } from "react";
import { useStore } from "@/lib/storage/core";
import {
  cookedStore,
  loadReviews,
  ratingsStore,
  reviewsBySlugStore,
  reviewsStorage,
  type ReviewWithAuthor,
} from "@/lib/storage/reviews";
import type { Review } from "@/types/review";
import { useCurrentUser } from "./use-current-user";

export type { ReviewWithAuthor };

export interface RatingSummary {
  count: number;
  /** 0 when there are no reviews. */
  average: number;
  /** How many reviews gave 1–5 stars, index 0 = 1 star. */
  breakdown: number[];
}

export function summarize(reviews: Pick<Review, "rating">[]): RatingSummary {
  const breakdown = [0, 0, 0, 0, 0];
  reviews.forEach((r) => breakdown[r.rating - 1]++);
  const count = reviews.length;
  return { count, average: count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0, breakdown };
}

const NO_REVIEWS: ReviewWithAuthor[] = [];

/** Real reviews of one recipe, newest first (loaded when the recipe page opens). */
export function useRecipeReviews(recipeSlug: string) {
  const bySlug = useStore(reviewsBySlugStore);
  const cooked = useStore(cookedStore);
  const { user } = useCurrentUser();

  useEffect(() => {
    void loadReviews(recipeSlug);
  }, [recipeSlug]);

  return useMemo(() => {
    const reviews = bySlug[recipeSlug] ?? NO_REVIEWS;
    return {
      reviews,
      summary: summarize(reviews),
      mine: user ? (reviews.find((r) => r.authorId === user.id) ?? null) : null,
      /** When the signed-in user finished this recipe in cooking mode, if they have. */
      cookedAt: cooked[recipeSlug] ?? null,
      ...reviewsStorage,
    };
  }, [bySlug, cooked, recipeSlug, user]);
}

/** Total number of reviews (admin dashboard). */
export function useReviewCount() {
  const ratings = useStore(ratingsStore);
  return useMemo(() => Object.values(ratings).reduce((sum, r) => sum + r.count, 0), [ratings]);
}

/** Average rating for one recipe from real reviews, or null when it has none. */
export function useRatingSummary(recipeSlug: string): RatingSummary | null {
  const totals = useStore(ratingsStore)[recipeSlug];
  return useMemo(
    () => (totals && totals.count > 0 ? { count: totals.count, average: totals.average, breakdown: [] } : null),
    [totals],
  );
}

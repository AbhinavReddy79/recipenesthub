import { useMemo } from "react";
import { accountsStore, toProfile } from "@/lib/storage/accounts";
import { useStore } from "@/lib/storage/core";
import { cookedStore, reviewsStorage, reviewsStore } from "@/lib/storage/reviews";
import type { Review } from "@/types/review";
import type { UserProfile } from "@/types/user";
import { useCurrentUser } from "./use-current-user";

export interface ReviewWithAuthor extends Review {
  author: UserProfile;
}

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

/** Real reviews of one recipe from profiles on this device, newest first. */
export function useRecipeReviews(recipeSlug: string) {
  const all = useStore(reviewsStore);
  const accounts = useStore(accountsStore);
  const cooked = useStore(cookedStore);
  const { user } = useCurrentUser();

  return useMemo(() => {
    const byId = new Map(accounts.map((a) => [a.id, toProfile(a)]));
    const reviews: ReviewWithAuthor[] = all
      .filter((r) => r.recipeSlug === recipeSlug && byId.has(r.authorId))
      .map((r) => ({ ...r, author: byId.get(r.authorId)! }))
      .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt));
    return {
      reviews,
      summary: summarize(reviews),
      mine: user ? (reviews.find((r) => r.authorId === user.id) ?? null) : null,
      /** When the signed-in user finished this recipe in cooking mode, if they have. */
      cookedAt: cooked[recipeSlug] ?? null,
      ...reviewsStorage,
    };
  }, [all, accounts, cooked, recipeSlug, user]);
}

/** Total number of reviews on this device (admin dashboard). */
export function useReviewCount() {
  return useStore(reviewsStore).length;
}

/** Average rating for one recipe from real reviews, or null when it has none. */
export function useRatingSummary(recipeSlug: string): RatingSummary | null {
  const all = useStore(reviewsStore);
  return useMemo(() => {
    const summary = summarize(all.filter((r) => r.recipeSlug === recipeSlug));
    return summary.count ? summary : null;
  }, [all, recipeSlug]);
}

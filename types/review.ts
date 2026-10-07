/** A rating left by a profile after cooking a recipe. */
export interface Review {
  id: string;
  recipeSlug: string;
  /** The account that wrote it; name and photo are read from the account. */
  authorId: string;
  /** 1–5 stars. */
  rating: number;
  /** Optional notes, tips or tweaks. */
  text: string;
  createdAt: string;
  updatedAt?: string;
}

export const REVIEW_TEXT_MAX = 1000;

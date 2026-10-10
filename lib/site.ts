import type { AuthorSummary } from "@/types/recipe";

export const siteConfig = {
  name: "RecipeNest",
  tagline: "Discover recipes worth cooking.",
  description:
    "Explore delicious recipes, organize your favorites, plan your meals, and discover new flavors from a community of food lovers.",
  // An explicit NEXT_PUBLIC_SITE_URL wins; on Vercel, fall back to the project's production domain.
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000"),
  ogImage:
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&h=630&q=80",
};

/** Author of the official recipe catalog (platform content, not a user account). */
export const PLATFORM_AUTHOR: AuthorSummary = {
  id: "recipenest-kitchen",
  name: "RecipeNest Kitchen",
  username: "recipenest",
  avatar: "",
};

export const isPlatformAuthor = (authorId: string) => authorId === PLATFORM_AUTHOR.id;

/**
 * Switches for features that aren't ready for the public site yet.
 * NEXT_PUBLIC_* values are fixed at build time.
 */
export const features = {
  /** No email service is connected yet, so the newsletter sign-up is hidden rather than promising emails. */
  newsletter: false,
};

/** Optional public contact address for the privacy and terms pages. */
export const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

export const mainNav = [
  { label: "Recipes", href: "/recipes" },
  { label: "Cuisines", href: "/cuisines" },
  { label: "Meal Planner", href: "/meal-planner" },
  { label: "Shopping List", href: "/shopping-list" },
  { label: "Weekly Contest", href: "/contests" },
] as const;

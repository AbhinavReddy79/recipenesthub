/** Plans and limits. The database enforces the same numbers (supabase/migrations). */

export const FREE_RECIPES_PER_MONTH = 5;

/** Premium can't be bought: members win it in the weekly lucky draw (or the contest). */
export const DRAW_PREMIUM_MONTHS = 3;

export const FREE_FEATURES = [
  "Every recipe, cuisine and state",
  "Meal planner and shopping lists",
  "Save, collect and review recipes",
  `Publish up to ${FREE_RECIPES_PER_MONTH} recipes a month`,
  "Join the weekly lucky draw",
  "Vote in the weekly contest",
];

export const PREMIUM_FEATURES = [
  "Everything in Free",
  "Publish unlimited recipes",
  "Enter the weekly cooking contest",
  "Premium badge on your profile",
];

export const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

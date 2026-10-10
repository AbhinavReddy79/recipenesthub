/** Plans and limits. The database enforces the same numbers (supabase/migrations/…_premium_contests.sql). */

export type BillingPeriod = "monthly" | "yearly";

export const FREE_RECIPES_PER_MONTH = 5;

export const PREMIUM_PRICES: Record<BillingPeriod, { amount: number; per: string; label: string }> = {
  monthly: { amount: 79, per: "month", label: "Monthly" },
  yearly: { amount: 899, per: "year", label: "Yearly" },
};

/** What a year costs when paying monthly, to show the yearly saving. */
export const YEARLY_SAVING = PREMIUM_PRICES.monthly.amount * 12 - PREMIUM_PRICES.yearly.amount;

export const FREE_FEATURES = [
  "Every recipe, cuisine and state",
  "Meal planner and shopping lists",
  "Save, collect and review recipes",
  `Publish up to ${FREE_RECIPES_PER_MONTH} recipes a month`,
  "Vote in the weekly contest",
];

export const PREMIUM_FEATURES = [
  "Everything in Free",
  "Publish unlimited recipes",
  "Enter the weekly cooking contest",
  "Win cash prizes and a free Premium month",
  "Premium badge on your profile",
];

export const formatRupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

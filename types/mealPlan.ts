import type { IngredientAisle } from "./recipe";

export const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

export type DayOfWeek = (typeof DAYS)[number];
export type MealSlotType = (typeof MEAL_SLOTS)[number];

export interface PlannedMeal {
  recipeSlug: string;
  servings: number;
}

/** A week keyed by day, then by meal slot. Missing slots are empty. */
export type WeekPlan = Record<DayOfWeek, Partial<Record<MealSlotType, PlannedMeal>>>;

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number | null;
  unit: string;
  aisle: IngredientAisle;
  checked: boolean;
  /** Recipe titles that contributed to this item (when generated). */
  sources: string[];
  /**
   * Set when the item was added as a RecipeNest Pantry product. `quantity` is
   * then the number of packs; the price is an estimate.
   */
  product?: { id: string; packSize: string; price: number };
}

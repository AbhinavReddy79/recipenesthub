import type { WeekPlan } from "@/types/mealPlan";

export const emptyWeek: WeekPlan = {
  Monday: {},
  Tuesday: {},
  Wednesday: {},
  Thursday: {},
  Friday: {},
  Saturday: {},
  Sunday: {},
};

/**
 * Illustration for the homepage "how the planner works" preview only.
 * Never written to anyone's meal plan.
 */
export const exampleWeek: WeekPlan = {
  Monday: { Dinner: { recipeSlug: "creamy-garlic-pasta", servings: 2 } },
  Tuesday: { Dinner: { recipeSlug: "street-style-chicken-tacos", servings: 4 } },
  Wednesday: { Dinner: { recipeSlug: "butter-chicken", servings: 4 } },
  Thursday: { Dinner: { recipeSlug: "lemon-herb-salmon", servings: 2 } },
  Friday: { Dinner: { recipeSlug: "margherita-pizza", servings: 2 } },
  Saturday: { Dinner: { recipeSlug: "hyderabadi-chicken-biryani", servings: 6 } },
  Sunday: { Lunch: { recipeSlug: "korean-bibimbap", servings: 4 } },
};

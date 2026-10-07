import { useStore } from "@/lib/storage/core";
import { countPlannedMeals, mealPlanStorage, mealPlanStore } from "@/lib/storage/mealPlanner";

export type { SlotRef } from "@/lib/storage/mealPlanner";
export { countPlannedMeals };
export const mealPlanActions = mealPlanStorage;

export function useMealPlan() {
  const plan = useStore(mealPlanStore);
  return { plan, mealCount: countPlannedMeals(plan), ...mealPlanStorage };
}

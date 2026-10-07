import { emptyWeek } from "@/data/mealPlans";
import { DAYS, MEAL_SLOTS, type DayOfWeek, type MealSlotType, type PlannedMeal, type WeekPlan } from "@/types/mealPlan";
import { createPersistentStore, isRecord, isString } from "./core";

export interface SlotRef {
  day: DayOfWeek;
  slot: MealSlotType;
}

const isMeal = (value: unknown): value is PlannedMeal =>
  isRecord(value) && isString(value.recipeSlug) && typeof value.servings === "number" && value.servings > 0;

/** Rebuilds a clean week, keeping only well-formed meals. */
function sanitizeWeek(value: unknown): WeekPlan | null {
  if (!isRecord(value)) return null;
  const week: WeekPlan = { ...emptyWeek };
  for (const day of DAYS) {
    const saved = value[day];
    const clean: WeekPlan[DayOfWeek] = {};
    if (isRecord(saved)) {
      for (const slot of MEAL_SLOTS) {
        if (isMeal(saved[slot])) clean[slot] = saved[slot] as PlannedMeal;
      }
    }
    week[day] = clean;
  }
  return week;
}

/** The signed-in user's week. Starts empty. */
export const mealPlanStore = createPersistentStore<WeekPlan>("meal-plan", emptyWeek, sanitizeWeek, "user");

export const mealPlanStorage = {
  assign({ day, slot }: SlotRef, recipeSlug: string, servings: number) {
    mealPlanStore.set((prev) => ({ ...prev, [day]: { ...prev[day], [slot]: { recipeSlug, servings } } }));
  },
  remove({ day, slot }: SlotRef) {
    mealPlanStore.set((prev) => {
      const nextDay = { ...prev[day] };
      delete nextDay[slot];
      return { ...prev, [day]: nextDay };
    });
  },
  setServings({ day, slot }: SlotRef, servings: number) {
    mealPlanStore.set((prev) => {
      const meal = prev[day][slot];
      if (!meal) return prev;
      return { ...prev, [day]: { ...prev[day], [slot]: { ...meal, servings } } };
    });
  },
  /** Moves a meal to another slot, swapping with whatever is already there. */
  move(from: SlotRef, to: SlotRef) {
    mealPlanStore.set((prev) => {
      const moving = prev[from.day][from.slot];
      if (!moving) return prev;
      const displaced = prev[to.day][to.slot];
      const next: WeekPlan = { ...prev, [from.day]: { ...prev[from.day] } };
      next[to.day] = { ...next[to.day] };
      delete next[from.day][from.slot];
      if (displaced) next[from.day][from.slot] = displaced;
      next[to.day][to.slot] = moving;
      return next;
    });
  },
  clearDay(day: DayOfWeek) {
    mealPlanStore.set((prev) => ({ ...prev, [day]: {} }));
  },
  clearWeek() {
    mealPlanStore.set(emptyWeek);
  },
  /** Removes every planned meal that uses a recipe (used when a recipe is deleted). */
  purgeRecipe(slug: string) {
    mealPlanStore.set((prev) => {
      const next = { ...prev };
      for (const day of DAYS) {
        const entries = Object.entries(prev[day]).filter(([, meal]) => meal?.recipeSlug !== slug);
        next[day] = Object.fromEntries(entries);
      }
      return next;
    });
  },
};

export function countPlannedMeals(plan: WeekPlan): number {
  return DAYS.reduce((acc, day) => acc + Object.keys(plan[day]).length, 0);
}

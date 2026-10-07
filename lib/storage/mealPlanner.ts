import { emptyWeek } from "@/data/mealPlans";
import type { RecipeNestClient } from "@/lib/supabase/client";
import { DAYS, MEAL_SLOTS, type DayOfWeek, type MealSlotType, type PlannedMeal, type WeekPlan } from "@/types/mealPlan";
import { createMemoryStore } from "./core";
import { persist, persistAll, userContext } from "./remote";

export interface SlotRef {
  day: DayOfWeek;
  slot: MealSlotType;
}

/** The signed-in user's week (one row per filled slot in meal_plan_entries). Starts empty. */
export const mealPlanStore = createMemoryStore<WeekPlan>(emptyWeek);

const isDay = (value: string): value is DayOfWeek => (DAYS as readonly string[]).includes(value);
const isSlot = (value: string): value is MealSlotType => (MEAL_SLOTS as readonly string[]).includes(value);

async function load(supabase: RecipeNestClient, userId: string): Promise<void> {
  const { data, error } = await supabase.from("meal_plan_entries").select("day, slot, recipe_slug, servings").eq("user_id", userId);
  if (error) throw error;
  const week: WeekPlan = Object.fromEntries(DAYS.map((day) => [day, {}])) as WeekPlan;
  for (const row of data) {
    if (isDay(row.day) && isSlot(row.slot)) week[row.day][row.slot] = { recipeSlug: row.recipe_slug, servings: row.servings };
  }
  mealPlanStore.set(week);
}

const reload = () => {
  const ctx = userContext();
  if (ctx) void load(ctx.supabase, ctx.userId).catch(() => {});
};

const same = (a: PlannedMeal | undefined, b: PlannedMeal | undefined) =>
  a?.recipeSlug === b?.recipeSlug && a?.servings === b?.servings;

/** Applies a change locally, then saves only the slots that changed. */
function commit(action: string, change: (prev: WeekPlan) => WeekPlan) {
  const ctx = userContext();
  if (!ctx) return;
  const prev = mealPlanStore.get();
  const next = change(prev);
  mealPlanStore.set(next);

  const upserts: { user_id: string; day: string; slot: string; recipe_slug: string; servings: number; updated_at: string }[] = [];
  const removals: SlotRef[] = [];
  for (const day of DAYS) {
    for (const slot of MEAL_SLOTS) {
      const before = prev[day][slot];
      const after = next[day][slot];
      if (same(before, after)) continue;
      if (after) {
        upserts.push({ user_id: ctx.userId, day, slot, recipe_slug: after.recipeSlug, servings: after.servings, updated_at: new Date().toISOString() });
      } else {
        removals.push({ day, slot });
      }
    }
  }
  persistAll(
    action,
    async () => {
      for (const { day, slot } of removals) {
        const removed = await ctx.supabase.from("meal_plan_entries").delete().eq("user_id", ctx.userId).eq("day", day).eq("slot", slot);
        if (removed.error) return removed;
      }
      if (upserts.length) return ctx.supabase.from("meal_plan_entries").upsert(upserts, { onConflict: "user_id,day,slot" });
    },
    reload,
  );
}

export const mealPlanStorage = {
  load,
  assign({ day, slot }: SlotRef, recipeSlug: string, servings: number) {
    commit("plan that meal", (prev) => ({ ...prev, [day]: { ...prev[day], [slot]: { recipeSlug, servings } } }));
  },
  remove({ day, slot }: SlotRef) {
    commit("clear that slot", (prev) => {
      const nextDay = { ...prev[day] };
      delete nextDay[slot];
      return { ...prev, [day]: nextDay };
    });
  },
  setServings({ day, slot }: SlotRef, servings: number) {
    commit("change the servings", (prev) => {
      const meal = prev[day][slot];
      if (!meal) return prev;
      return { ...prev, [day]: { ...prev[day], [slot]: { ...meal, servings } } };
    });
  },
  /** Moves a meal to another slot, swapping with whatever is already there. */
  move(from: SlotRef, to: SlotRef) {
    commit("move that meal", (prev) => {
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
    const ctx = userContext();
    if (!ctx) return;
    mealPlanStore.set((prev) => ({ ...prev, [day]: {} }));
    persist("clear that day", ctx.supabase.from("meal_plan_entries").delete().eq("user_id", ctx.userId).eq("day", day), reload);
  },
  clearWeek() {
    const ctx = userContext();
    if (!ctx) return;
    mealPlanStore.set(emptyWeek);
    persist("clear the week", ctx.supabase.from("meal_plan_entries").delete().eq("user_id", ctx.userId), reload);
  },
};

export function countPlannedMeals(plan: WeekPlan): number {
  return DAYS.reduce((acc, day) => acc + Object.keys(plan[day]).length, 0);
}

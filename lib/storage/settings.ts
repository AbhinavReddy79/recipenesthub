import { CUISINE_SLUGS } from "@/lib/labels";
import { DIETS } from "@/lib/recipes/query";
import type { Database } from "@/lib/supabase/database.types";
import type { RecipeNestClient } from "@/lib/supabase/client";
import type { CuisineSlug } from "@/types/recipe";
import type { NotificationSettings, UserPreferences, UserSettings } from "@/types/user";
import { createLocalStore, createMemoryStore, isString } from "./core";
import { persist, userContext } from "./remote";

export const defaultSettings: UserSettings = {
  preferences: { diet: "None", favoriteCuisines: [], defaultServings: 2 },
  notifications: { mealPlanReminders: true },
};

type SettingsRow = Database["public"]["Tables"]["user_settings"]["Row"];

function fromRow(row: SettingsRow): UserSettings {
  const diet = row.diet === "None" || (DIETS as readonly string[]).includes(row.diet) ? (row.diet as UserPreferences["diet"]) : "None";
  return {
    preferences: {
      diet,
      favoriteCuisines: row.favorite_cuisines.filter((c): c is CuisineSlug => (CUISINE_SLUGS as readonly string[]).includes(c)),
      defaultServings: row.default_servings,
    },
    notifications: { mealPlanReminders: row.meal_plan_reminders },
  };
}

/** The signed-in user's preferences (defaults for visitors). */
export const settingsStore = createMemoryStore<UserSettings>(defaultSettings);

async function load(supabase: RecipeNestClient, userId: string): Promise<void> {
  const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  settingsStore.set(data ? fromRow(data) : defaultSettings);
}

function save(next: UserSettings) {
  const ctx = userContext();
  if (!ctx) return;
  settingsStore.set(next);
  persist(
    "save your preferences",
    ctx.supabase.from("user_settings").upsert(
      {
        user_id: ctx.userId,
        diet: next.preferences.diet,
        favorite_cuisines: next.preferences.favoriteCuisines,
        default_servings: next.preferences.defaultServings,
        meal_plan_reminders: next.notifications.mealPlanReminders,
      },
      { onConflict: "user_id" },
    ),
    () => void load(ctx.supabase, ctx.userId).catch(() => {}),
  );
}

export const settingsStorage = {
  load,
  updatePreferences(patch: Partial<UserPreferences>) {
    const prev = settingsStore.get();
    save({ ...prev, preferences: { ...prev.preferences, ...patch } });
  },
  updateNotifications(patch: Partial<NotificationSettings>) {
    const prev = settingsStore.get();
    save({ ...prev, notifications: { ...prev.notifications, ...patch } });
  },
};

/**
 * Newsletter sign-up for this browser. Hidden while no email service is
 * connected (see `features.newsletter`); nothing is sent.
 */
export const newsletterStore = createLocalStore<string | null>("newsletter", null, (v) => (isString(v) ? v : null));

export const newsletterStorage = {
  subscribe: (email: string) => newsletterStore.set(email),
  unsubscribe: () => newsletterStore.set(null),
};

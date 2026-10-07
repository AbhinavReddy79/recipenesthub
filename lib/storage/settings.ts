import { CUISINE_SLUGS } from "@/lib/labels";
import { DIETS } from "@/lib/recipes/query";
import type { NotificationSettings, UserPreferences, UserSettings } from "@/types/user";
import { createPersistentStore, isRecord, isString } from "./core";

export const defaultSettings: UserSettings = {
  preferences: { diet: "None", favoriteCuisines: [], defaultServings: 2 },
  notifications: { mealPlanReminders: true },
};

function sanitizeSettings(value: unknown): UserSettings | null {
  if (!isRecord(value)) return null;
  const prefs = isRecord(value.preferences) ? value.preferences : {};
  const notes = isRecord(value.notifications) ? value.notifications : {};
  const diet = prefs.diet;
  const servings = Number(prefs.defaultServings);
  return {
    preferences: {
      diet: diet === "None" || DIETS.includes(diet as never) ? (diet as UserPreferences["diet"]) : "None",
      favoriteCuisines: Array.isArray(prefs.favoriteCuisines)
        ? prefs.favoriteCuisines.filter((c): c is UserPreferences["favoriteCuisines"][number] => CUISINE_SLUGS.includes(c))
        : [],
      defaultServings: Number.isInteger(servings) && servings >= 1 && servings <= 12 ? servings : 2,
    },
    notifications: {
      mealPlanReminders: typeof notes.mealPlanReminders === "boolean" ? notes.mealPlanReminders : true,
    },
  };
}

/** The signed-in user's preferences. */
export const settingsStore = createPersistentStore<UserSettings>("settings", defaultSettings, sanitizeSettings, "user");

export const settingsStorage = {
  updatePreferences(patch: Partial<UserPreferences>) {
    settingsStore.set((prev) => ({ ...prev, preferences: { ...prev.preferences, ...patch } }));
  },
  updateNotifications(patch: Partial<NotificationSettings>) {
    settingsStore.set((prev) => ({ ...prev, notifications: { ...prev.notifications, ...patch } }));
  },
};

/** Newsletter sign-up for this browser (doesn't need a profile). Nothing is sent — there is no backend yet. */
export const newsletterStore = createPersistentStore<string | null>("newsletter", null, (v) => (isString(v) ? v : null));

export const newsletterStorage = {
  subscribe: (email: string) => newsletterStore.set(email),
  unsubscribe: () => newsletterStore.set(null),
};

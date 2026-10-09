import type { CuisineSlug, Diet } from "./recipe";

export type AccountStatus = "active" | "suspended";
export type AccountRole = "user" | "admin";

/**
 * A RecipeNest account as the UI sees it: the public profile (profiles table)
 * plus the private email from Supabase Auth, which is only filled in for the
 * signed-in user and for admins.
 */
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  /** Empty for other people's profiles. */
  email: string;
  /** Public image URL, or "" to show initials. */
  avatar: string;
  bio: string;
  location: string;
  createdAt: string;
  status: AccountStatus;
  role: AccountRole;
  /** The site owner (only known in the admin console): the one account that controls admin access. */
  isOwner?: boolean;
}

export interface UserPreferences {
  diet: Diet | "None";
  favoriteCuisines: CuisineSlug[];
  defaultServings: number;
}

export interface NotificationSettings {
  mealPlanReminders: boolean;
}

/** Per-user settings that change how the app behaves. */
export interface UserSettings {
  preferences: UserPreferences;
  notifications: NotificationSettings;
}

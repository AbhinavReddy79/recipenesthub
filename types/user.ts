import type { CuisineSlug, Diet } from "./recipe";

export type AccountStatus = "active" | "suspended";

/**
 * A profile created by a real visitor on this device.
 * Frontend-only: replace with your auth provider's user record later.
 */
export interface UserAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  /** Uploaded photo as a data URL, or "" to show initials. */
  avatar: string;
  bio: string;
  location: string;
  createdAt: string;
  status: AccountStatus;
  /** Salted SHA-256 hash. Never the plain password. */
  passwordHash: string;
  passwordSalt: string;
}

/** The account fields that are safe to pass around the UI. */
export type UserProfile = Omit<UserAccount, "passwordHash" | "passwordSalt">;

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

/** Which account is signed in on this device, if any. */
export interface Session {
  userId: string | null;
  /** When false the session ends with the browser session. */
  remember: boolean;
}

import type { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { getSupabase, type RecipeNestClient } from "@/lib/supabase/client";
import { accountsStorage, accountsStore, fetchProfile, toProfile } from "./accounts";
import { collectionsStorage, collectionsStore } from "./collections";
import { readJSON, removeKey, STORAGE_PREFIX } from "./core";
import { favoritesStorage, favoritesStore } from "./favorites";
import { mealPlanStorage, mealPlanStore } from "./mealPlanner";
import { recipesStorage, userRecipesStore } from "./recipes";
import { reportError } from "./remote";
import { cookedStore, loadCooked, loadRatings, ratingsStore, reviewsBySlugStore } from "./reviews";
import { authStore } from "./session";
import { settingsStorage, settingsStore } from "./settings";
import { shoppingListStore, shoppingStorage } from "./shoppingList";

/* ---------- "Remember me" ---------- */

const REMEMBER_KEY = `${STORAGE_PREFIX}remember`;
const SESSION_FLAG = "recipenest:session-active";

/** Records whether this sign-in should outlive the browser session. */
export function rememberSignIn(remember: boolean): void {
  try {
    window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
    window.sessionStorage.setItem(SESSION_FLAG, "1");
  } catch {
    // ignore
  }
}

/** True when the last sign-in asked not to be remembered and the browser has since been restarted. */
function sessionExpired(): boolean {
  try {
    return window.localStorage.getItem(REMEMBER_KEY) === "0" && !window.sessionStorage.getItem(SESSION_FLAG);
  } catch {
    return false;
  }
}

/* ---------- Photo picked at sign-up ---------- */

const pendingAvatarKey = (email: string) => `${STORAGE_PREFIX}pending-avatar:${email.trim().toLowerCase()}`;

/** Keeps a photo chosen at sign-up until the account is confirmed and signed in. */
export function stashPendingAvatar(email: string, dataUrl: string): void {
  try {
    window.localStorage.setItem(pendingAvatarKey(email), JSON.stringify(dataUrl));
  } catch {
    // The photo is optional; it can be added later from the profile.
  }
}

async function uploadPendingAvatar(userId: string, email: string, currentAvatar: string): Promise<void> {
  const key = pendingAvatarKey(email);
  const dataUrl = readJSON(key);
  if (typeof dataUrl !== "string") return;
  removeKey(key);
  if (!currentAvatar) await accountsStorage.updateProfile(userId, { avatar: dataUrl });
}

/* ---------- Session → data ---------- */

function clearPersonalData(): void {
  [
    favoritesStore,
    collectionsStore,
    mealPlanStore,
    shoppingListStore,
    settingsStore,
    cookedStore,
    accountsStore,
    userRecipesStore,
    ratingsStore,
    reviewsBySlugStore,
  ].forEach((store) => store.reset());
}

async function loadPersonalData(supabase: RecipeNestClient, userId: string): Promise<void> {
  await Promise.all([
    favoritesStorage.load(supabase, userId),
    collectionsStorage.load(supabase, userId),
    mealPlanStorage.load(supabase, userId),
    shoppingStorage.load(supabase, userId),
    settingsStorage.load(supabase, userId),
    loadCooked(supabase, userId),
    loadRatings(supabase),
    recipesStorage.load(supabase),
  ]);
}

/** Re-reads the signed-in user's data (e.g. after a recipe they used was deleted). */
export async function reloadPersonalData(): Promise<void> {
  const supabase = getSupabase();
  const userId = authStore.get().user?.id;
  if (!supabase || !userId) return;
  await loadPersonalData(supabase, userId).catch((error: unknown) => reportError("refresh your data", error));
}

/**
 * Follows Supabase Auth for the lifetime of the page: loads the profile and
 * personal data on sign-in, clears them on sign-out. Returns a cleanup function.
 */
export function startSync(): () => void {
  const supabase = getSupabase();
  if (!supabase) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("RecipeNest: Supabase isn't configured (see .env.example). Accounts and saving are disabled.");
    }
    authStore.set({ ready: true, user: null });
    return () => {};
  }

  let currentUserId: string | null | undefined;
  let run = 0;

  const apply = async (user: User | null) => {
    const userId = user?.id ?? null;
    if (userId === currentUserId) {
      // Same account (token refresh, email change): keep the email current.
      if (user?.email) authStore.set((s) => (s.user ? { ...s, user: { ...s.user, email: user.email ?? s.user.email } } : s));
      return;
    }
    currentUserId = userId;
    const thisRun = ++run;

    // Members-only: signed-out visitors load nothing from the database.
    if (!user || !userId) {
      clearPersonalData();
      authStore.set({ ready: true, user: null });
      return;
    }

    authStore.set({ ready: false, user: null });
    try {
      const row = await fetchProfile(supabase, userId);
      if (thisRun !== run) return;
      if (!row) throw new Error("This account has no profile.");
      if (row.status === "suspended") {
        await supabase.auth.signOut();
        toast.error("This account has been suspended. Contact the RecipeNest team if you think this is a mistake.");
        return;
      }
      const profile = toProfile(row, user.email ?? "");
      authStore.set({ ready: false, user: profile });
      await loadPersonalData(supabase, userId);
      await uploadPendingAvatar(userId, profile.email, profile.avatar);
      if (thisRun !== run) return;
      authStore.set((s) => ({ ...s, ready: true }));
    } catch (error) {
      reportError("load your account", error);
      authStore.set((s) => ({ ...s, ready: true }));
    }
  };

  if (sessionExpired()) void supabase.auth.signOut();

  // Supabase recommends not awaiting other Supabase calls inside this callback.
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => void apply(session?.user ?? null), 0);
  });
  return () => data.subscription.unsubscribe();
}

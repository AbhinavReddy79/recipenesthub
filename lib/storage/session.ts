import type { UserProfile } from "@/types/user";
import { createMemoryStore } from "./core";

export interface AuthState {
  /** False until the session (and, when signed in, the user's data) has loaded. */
  ready: boolean;
  user: UserProfile | null;
}

/** Who is signed in. Kept in sync with Supabase Auth by lib/storage/sync.ts. */
export const authStore = createMemoryStore<AuthState>({ ready: false, user: null });

export function getActiveUserId(): string | null {
  return authStore.get().user?.id ?? null;
}

export function setCurrentProfile(update: (profile: UserProfile) => UserProfile): void {
  authStore.set((state) => (state.user ? { ...state, user: update(state.user) } : state));
}

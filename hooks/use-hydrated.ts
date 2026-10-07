import { useSyncExternalStore } from "react";
import { authStore } from "@/lib/storage/session";

const isReady = () => authStore.get().ready;
const serverSnapshot = () => false;

/**
 * `false` during SSR and hydration, and until the session (plus the signed-in
 * user's data) has loaded from Supabase; `true` afterwards. Use it to show a
 * skeleton instead of flashing empty state before saved data arrives.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(authStore.subscribe, isReady, serverSnapshot);
}

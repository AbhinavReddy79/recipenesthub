"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { unreadSupportReplies } from "@/lib/storage/messages";

// One shared count for the account menu, refreshed every few minutes.
let count = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

const setCount = (next: number) => {
  if (next === count) return;
  count = next;
  emit();
};

export function refreshUnreadSupport() {
  void unreadSupportReplies().then(setCount);
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** How many support conversations have a reply from RecipeNest the member hasn't opened. */
export function useUnreadSupport(): number {
  const { user } = useCurrentUser();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setCount(0);
      return;
    }
    refreshUnreadSupport();
    const id = window.setInterval(refreshUnreadSupport, 180_000);
    return () => window.clearInterval(id);
  }, [userId]);

  return useSyncExternalStore(
    subscribe,
    () => count,
    () => 0,
  );
}

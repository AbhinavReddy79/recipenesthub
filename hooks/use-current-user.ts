import { useMemo } from "react";
import { accountsStorage, accountsStore, toProfile } from "@/lib/storage/accounts";
import { sessionStore, useStore } from "@/lib/storage/core";
import type { UserProfile } from "@/types/user";

/**
 * The signed-in profile, or null for visitors. Every place that shows "you"
 * (navbar, profile, recipe bylines, settings) reads it from here.
 */
export function useCurrentUser(): {
  user: UserProfile | null;
  update: typeof accountsStorage.updateProfile;
} {
  const session = useStore(sessionStore);
  const accounts = useStore(accountsStore);
  const user = useMemo(() => {
    const account = session.userId ? accounts.find((a) => a.id === session.userId) : undefined;
    return account ? toProfile(account) : null;
  }, [session.userId, accounts]);
  return { user, update: accountsStorage.updateProfile };
}

export function useAccounts() {
  const accounts = useStore(accountsStore);
  return { accounts: useMemo(() => accounts.map(toProfile), [accounts]), ...accountsStorage };
}

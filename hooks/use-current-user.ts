import { useEffect } from "react";
import { accountsStorage, accountsStore } from "@/lib/storage/accounts";
import { useStore } from "@/lib/storage/core";
import { authStore } from "@/lib/storage/session";
import type { UserProfile } from "@/types/user";

/**
 * The signed-in profile, or null for visitors. Every place that shows "you"
 * (navbar, profile, recipe bylines, settings) reads it from here.
 */
export function useCurrentUser(): {
  user: UserProfile | null;
  isAdmin: boolean;
  update: typeof accountsStorage.updateProfile;
} {
  const { user } = useStore(authStore);
  return { user, isAdmin: user?.role === "admin" && user.status === "active", update: accountsStorage.updateProfile };
}

/** Every account (admin console only; loads on first use). */
export function useAccounts() {
  const accounts = useStore(accountsStore);
  const { user, isAdmin } = useCurrentUser();
  useEffect(() => {
    if (isAdmin) void accountsStorage.loadAll();
  }, [isAdmin]);
  // Only the console list knows who the owner is; it controls admin access.
  const isOwner = Boolean(user && accounts.some((a) => a.id === user.id && a.isOwner));
  return { accounts, isOwner, setStatus: accountsStorage.setStatus, setRole: accountsStorage.setRole, remove: accountsStorage.remove };
}

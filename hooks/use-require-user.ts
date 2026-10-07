import { useCallback } from "react";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { useCurrentUser } from "./use-current-user";

/**
 * Guards personal actions (saving, collections, planning). Visitors are asked
 * to create a profile first; returns true when the action may proceed.
 */
export function useRequireUser() {
  const { user } = useCurrentUser();
  const { openAuth } = useAuthDialog();
  return useCallback(
    (reason: string) => {
      if (user) return true;
      openAuth("register", reason);
      return false;
    },
    [user, openAuth],
  );
}

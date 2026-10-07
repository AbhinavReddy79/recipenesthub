import { useMemo } from "react";
import { accountsStore } from "@/lib/storage/accounts";
import { sessionStore, useStore } from "@/lib/storage/core";
import { recipesStorage, userRecipesStore } from "@/lib/storage/recipes";

export const userRecipeActions = recipesStorage;

/**
 * Recipes written on this device. Bylines are resolved live from the author's
 * account, so profile edits show up everywhere immediately.
 */
export function useUserRecipes() {
  const stored = useStore(userRecipesStore);
  const accounts = useStore(accountsStore);
  const { userId } = useStore(sessionStore);

  const all = useMemo(
    () =>
      stored.flatMap((r) => {
        const account = accounts.find((a) => a.id === r.authorId);
        // Recipes whose author no longer exists are not shown.
        if (!account) return [];
        return [{ ...r, author: { id: account.id, name: account.name, username: account.username, avatar: account.avatar } }];
      }),
    [stored, accounts],
  );
  const published = useMemo(() => all.filter((r) => r.status === "published"), [all]);
  const mine = useMemo(() => (userId ? all.filter((r) => r.authorId === userId) : []), [all, userId]);
  const myPublished = useMemo(() => mine.filter((r) => r.status === "published"), [mine]);
  const myDrafts = useMemo(() => mine.filter((r) => r.status === "draft"), [mine]);

  return { all, published, mine, myPublished, myDrafts, ...recipesStorage };
}

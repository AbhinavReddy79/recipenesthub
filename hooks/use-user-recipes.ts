import { useMemo } from "react";
import { useStore } from "@/lib/storage/core";
import { recipesStorage, userRecipesStore } from "@/lib/storage/recipes";
import { authStore } from "@/lib/storage/session";

export const userRecipeActions = recipesStorage;

/**
 * Community recipes from Supabase: everyone's published recipes plus the
 * signed-in author's drafts (admins also see everyone's drafts).
 */
export function useUserRecipes() {
  const all = useStore(userRecipesStore);
  const userId = useStore(authStore).user?.id ?? null;

  const published = useMemo(() => all.filter((r) => r.status === "published"), [all]);
  const mine = useMemo(() => (userId ? all.filter((r) => r.authorId === userId) : []), [all, userId]);
  const myPublished = useMemo(() => mine.filter((r) => r.status === "published"), [mine]);
  const myDrafts = useMemo(() => mine.filter((r) => r.status === "draft"), [mine]);

  return { all, published, mine, myPublished, myDrafts, ...recipesStorage };
}

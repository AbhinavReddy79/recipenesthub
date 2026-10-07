import { useCallback } from "react";
import { toast } from "sonner";
import { useStore } from "@/lib/storage/core";
import { favoritesStorage, favoritesStore } from "@/lib/storage/favorites";
import { useRequireUser } from "./use-require-user";

export function useFavorites() {
  const slugs = useStore(favoritesStore);

  const isFavorite = useCallback((slug: string) => slugs.includes(slug), [slugs]);
  const requireUser = useRequireUser();

  const toggle = useCallback((slug: string, title?: string) => {
    if (!requireUser("Create a free profile to save recipes to your cookbook.")) return;
    const saved = favoritesStorage.toggle(slug);
    const name = title ? ` “${title}”` : "";
    if (saved) {
      toast.success(`Saved${name} to your cookbook`);
    } else {
      toast(`Removed${name} from Saved`, {
        action: { label: "Undo", onClick: () => favoritesStorage.add(slug) },
      });
    }
  }, [requireUser]);

  return { slugs, count: slugs.length, isFavorite, toggle };
}

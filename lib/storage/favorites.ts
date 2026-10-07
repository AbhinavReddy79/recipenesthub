import { arrayOf, createPersistentStore, isString } from "./core";

/** Recipe slugs the signed-in user has saved. Starts empty. */
export const favoritesStore = createPersistentStore<string[]>("favorites", [], arrayOf(isString), "user");

export const favoritesStorage = {
  has: (slug: string) => favoritesStore.get().includes(slug),
  add(slug: string) {
    favoritesStore.set((prev) => (prev.includes(slug) ? prev : [slug, ...prev]));
  },
  remove(slug: string) {
    favoritesStore.set((prev) => prev.filter((s) => s !== slug));
  },
  /** Returns true when the recipe is now saved. */
  toggle(slug: string): boolean {
    const saved = favoritesStorage.has(slug);
    if (saved) favoritesStorage.remove(slug);
    else favoritesStorage.add(slug);
    return !saved;
  },
};

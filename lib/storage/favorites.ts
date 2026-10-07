import type { RecipeNestClient } from "@/lib/supabase/client";
import { createMemoryStore } from "./core";
import { persist, userContext } from "./remote";

/** Recipe slugs the signed-in user has saved, newest first. Starts empty. */
export const favoritesStore = createMemoryStore<string[]>([]);

async function load(supabase: RecipeNestClient, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("favorites")
    .select("recipe_slug")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  favoritesStore.set(data.map((row) => row.recipe_slug));
}

const reload = () => {
  const ctx = userContext();
  if (ctx) void load(ctx.supabase, ctx.userId).catch(() => {});
};

export const favoritesStorage = {
  load,
  has: (slug: string) => favoritesStore.get().includes(slug),
  add(slug: string) {
    const ctx = userContext();
    if (!ctx || favoritesStorage.has(slug)) return;
    favoritesStore.set((prev) => [slug, ...prev]);
    persist("save that recipe", ctx.supabase.from("favorites").insert({ user_id: ctx.userId, recipe_slug: slug }), reload);
  },
  remove(slug: string) {
    const ctx = userContext();
    if (!ctx) return;
    favoritesStore.set((prev) => prev.filter((s) => s !== slug));
    persist(
      "remove that recipe",
      ctx.supabase.from("favorites").delete().eq("user_id", ctx.userId).eq("recipe_slug", slug),
      reload,
    );
  },
  /** Returns true when the recipe is now saved. */
  toggle(slug: string): boolean {
    const saved = favoritesStorage.has(slug);
    if (saved) favoritesStorage.remove(slug);
    else favoritesStorage.add(slug);
    return !saved;
  },
};

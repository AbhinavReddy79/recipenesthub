import type { RecipeNestClient } from "@/lib/supabase/client";
import { newId } from "@/lib/utils";
import type { Collection } from "@/types/collection";
import { createMemoryStore } from "./core";
import { persist, persistAll, userContext } from "./remote";

/** The signed-in user's collections, newest first. Starts empty. */
export const collectionsStore = createMemoryStore<Collection[]>([]);

async function load(supabase: RecipeNestClient, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("collections")
    .select("id, name, description, cover_url, created_at, updated_at, collection_recipes(recipe_slug, added_at)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  collectionsStore.set(
    data.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      ...(row.cover_url ? { cover: row.cover_url } : {}),
      // Recipes are shown newest-added first.
      recipeSlugs: [...row.collection_recipes].sort((a, b) => b.added_at.localeCompare(a.added_at)).map((r) => r.recipe_slug),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  );
}

const reload = () => {
  const ctx = userContext();
  if (ctx) void load(ctx.supabase, ctx.userId).catch(() => {});
};

const now = () => new Date().toISOString();

function patchLocal(id: string, update: (c: Collection) => Collection) {
  collectionsStore.set((prev) => prev.map((c) => (c.id === id ? { ...update(c), updatedAt: now() } : c)));
}

/** Marks a collection as updated after its recipe list changes. */
function touch(supabase: RecipeNestClient, id: string) {
  return supabase.from("collections").update({ updated_at: now() }).eq("id", id);
}

export const collectionsStorage = {
  load,
  create(input: { name: string; description: string; recipeSlugs?: string[] }): Collection {
    const collection: Collection = {
      id: newId(),
      name: input.name.trim(),
      description: input.description.trim(),
      recipeSlugs: input.recipeSlugs ?? [],
      createdAt: now(),
      updatedAt: now(),
    };
    const ctx = userContext();
    if (!ctx) return collection;
    collectionsStore.set((prev) => [collection, ...prev]);
    persistAll(
      "create that collection",
      async () => {
        const created = await ctx.supabase
          .from("collections")
          .insert({ id: collection.id, user_id: ctx.userId, name: collection.name, description: collection.description });
        if (created.error || collection.recipeSlugs.length === 0) return created;
        return ctx.supabase
          .from("collection_recipes")
          .insert(collection.recipeSlugs.map((recipe_slug) => ({ collection_id: collection.id, recipe_slug })));
      },
      reload,
    );
    return collection;
  },
  update(id: string, input: { name: string; description: string }) {
    const ctx = userContext();
    if (!ctx) return;
    const name = input.name.trim();
    const description = input.description.trim();
    patchLocal(id, (c) => ({ ...c, name, description }));
    persist("update that collection", ctx.supabase.from("collections").update({ name, description }).eq("id", id), reload);
  },
  remove(id: string) {
    const ctx = userContext();
    if (!ctx) return;
    collectionsStore.set((prev) => prev.filter((c) => c.id !== id));
    persist("delete that collection", ctx.supabase.from("collections").delete().eq("id", id), reload);
  },
  addRecipe(id: string, slug: string) {
    const ctx = userContext();
    const collection = collectionsStore.get().find((c) => c.id === id);
    if (!ctx || !collection || collection.recipeSlugs.includes(slug)) return;
    patchLocal(id, (c) => ({ ...c, recipeSlugs: [slug, ...c.recipeSlugs] }));
    persistAll(
      "add that recipe",
      async () => {
        const added = await ctx.supabase.from("collection_recipes").insert({ collection_id: id, recipe_slug: slug });
        return added.error ? added : touch(ctx.supabase, id);
      },
      reload,
    );
  },
  removeRecipe(id: string, slug: string) {
    const ctx = userContext();
    if (!ctx) return;
    patchLocal(id, (c) => ({ ...c, recipeSlugs: c.recipeSlugs.filter((s) => s !== slug) }));
    persistAll(
      "remove that recipe",
      async () => {
        const removed = await ctx.supabase.from("collection_recipes").delete().eq("collection_id", id).eq("recipe_slug", slug);
        return removed.error ? removed : touch(ctx.supabase, id);
      },
      reload,
    );
  },
  toggleRecipe(id: string, slug: string) {
    const collection = collectionsStore.get().find((c) => c.id === id);
    if (!collection) return;
    if (collection.recipeSlugs.includes(slug)) collectionsStorage.removeRecipe(id, slug);
    else collectionsStorage.addRecipe(id, slug);
  },
};

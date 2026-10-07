import { createId } from "@/lib/utils";
import type { Collection } from "@/types/collection";
import { arrayOf, createPersistentStore, isRecord, isString } from "./core";

const isCollection = (value: unknown): value is Collection =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  Array.isArray(value.recipeSlugs) &&
  value.recipeSlugs.every(isString);

/** The signed-in user's collections. Starts empty. */
export const collectionsStore = createPersistentStore<Collection[]>(
  "collections",
  [],
  (value) =>
    arrayOf(isCollection)(value)?.map((c) => ({
      ...c,
      description: isString(c.description) ? c.description : "",
      createdAt: isString(c.createdAt) ? c.createdAt : "",
      updatedAt: isString(c.updatedAt) ? c.updatedAt : "",
    })) ?? null,
  "user",
);

const today = () => new Date().toISOString().slice(0, 10);

function patch(id: string, update: (c: Collection) => Collection) {
  collectionsStore.set((prev) => prev.map((c) => (c.id === id ? { ...update(c), updatedAt: today() } : c)));
}

export const collectionsStorage = {
  create(input: { name: string; description: string; recipeSlugs?: string[] }): Collection {
    const collection: Collection = {
      id: createId("col"),
      name: input.name.trim(),
      description: input.description.trim(),
      recipeSlugs: input.recipeSlugs ?? [],
      createdAt: today(),
      updatedAt: today(),
    };
    collectionsStore.set((prev) => [collection, ...prev]);
    return collection;
  },
  update(id: string, input: { name: string; description: string }) {
    patch(id, (c) => ({ ...c, name: input.name.trim(), description: input.description.trim() }));
  },
  remove(id: string) {
    collectionsStore.set((prev) => prev.filter((c) => c.id !== id));
  },
  addRecipe(id: string, slug: string) {
    patch(id, (c) => (c.recipeSlugs.includes(slug) ? c : { ...c, recipeSlugs: [slug, ...c.recipeSlugs] }));
  },
  removeRecipe(id: string, slug: string) {
    patch(id, (c) => ({ ...c, recipeSlugs: c.recipeSlugs.filter((s) => s !== slug) }));
  },
  toggleRecipe(id: string, slug: string) {
    patch(id, (c) => ({
      ...c,
      recipeSlugs: c.recipeSlugs.includes(slug) ? c.recipeSlugs.filter((s) => s !== slug) : [slug, ...c.recipeSlugs],
    }));
  },
  /** Removes a recipe from every collection (used when a recipe is deleted). */
  purgeRecipe(slug: string) {
    collectionsStore.set((prev) =>
      prev.map((c) => (c.recipeSlugs.includes(slug) ? { ...c, recipeSlugs: c.recipeSlugs.filter((s) => s !== slug) } : c)),
    );
  },
};

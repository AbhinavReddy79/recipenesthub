import { mergeShoppingLists } from "@/lib/shopping";
import { createId } from "@/lib/utils";
import type { ShoppingItem } from "@/types/mealPlan";
import type { PantryProduct } from "@/types/product";
import type { IngredientAisle } from "@/types/recipe";
import { arrayOf, createPersistentStore, isRecord, isString } from "./core";

const AISLES: IngredientAisle[] = ["Produce", "Dairy", "Meat", "Grains", "Spices", "Other"];

const isItem = (value: unknown): value is ShoppingItem =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  (value.quantity === null || typeof value.quantity === "number") &&
  isString(value.unit) &&
  AISLES.includes(value.aisle as IngredientAisle) &&
  typeof value.checked === "boolean";

export const shoppingListStore = createPersistentStore<ShoppingItem[]>(
  "shopping-list",
  [],
  (value) =>
    arrayOf(isItem)(value)?.map((i) => {
      const product = isRecord(i.product) && isString(i.product.id) && isString(i.product.packSize) && typeof i.product.price === "number" ? i.product : undefined;
      return { ...i, sources: Array.isArray(i.sources) ? i.sources : [], product };
    }) ?? null,
  "user",
);

export type ShoppingItemInput = Pick<ShoppingItem, "name" | "quantity" | "unit" | "aisle">;

export interface ProductEntry {
  product: PantryProduct;
  packs: number;
  source: string;
}

export const shoppingStorage = {
  /** Adds pantry products; a product already on the list (and not yet checked off) gets more packs instead. */
  addProducts(entries: ProductEntry[]) {
    shoppingListStore.set((prev) => {
      const next = prev.map((i) => ({ ...i, sources: [...i.sources] }));
      for (const { product, packs, source } of entries) {
        const existing = next.find((i) => !i.checked && i.product?.id === product.id);
        if (existing) {
          existing.quantity = (existing.quantity ?? 0) + packs;
          if (!existing.sources.includes(source)) existing.sources.push(source);
        } else {
          next.unshift({
            id: createId("item"),
            name: product.name,
            quantity: packs,
            unit: "",
            aisle: product.aisle,
            checked: false,
            sources: [source],
            product: { id: product.id, packSize: product.packSize, price: product.price },
          });
        }
      }
      return next;
    });
  },
  add(input: ShoppingItemInput) {
    shoppingListStore.set((prev) => [{ ...input, id: createId("item"), checked: false, sources: [] }, ...prev]);
  },
  update(id: string, input: ShoppingItemInput) {
    shoppingListStore.set((prev) => prev.map((i) => (i.id === id ? { ...i, ...input } : i)));
  },
  remove(id: string) {
    shoppingListStore.set((prev) => prev.filter((i) => i.id !== id));
  },
  toggle(id: string) {
    shoppingListStore.set((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  },
  clearCompleted() {
    shoppingListStore.set((prev) => prev.filter((i) => !i.checked));
  },
  clearAll() {
    shoppingListStore.set([]);
  },
  merge(generated: ShoppingItem[]) {
    shoppingListStore.set((prev) => mergeShoppingLists(prev, generated));
  },
};

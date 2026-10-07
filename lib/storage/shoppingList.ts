import { mergeShoppingLists } from "@/lib/shopping";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { RecipeNestClient } from "@/lib/supabase/client";
import { newId } from "@/lib/utils";
import type { ShoppingItem } from "@/types/mealPlan";
import type { PantryProduct } from "@/types/product";
import type { IngredientAisle } from "@/types/recipe";
import { createMemoryStore, isRecord, isString } from "./core";
import { persistAll, userContext } from "./remote";

const AISLES: IngredientAisle[] = ["Produce", "Dairy", "Meat", "Grains", "Spices", "Other"];

type ItemRow = Database["public"]["Tables"]["shopping_list_items"]["Row"];
type ItemInsert = Database["public"]["Tables"]["shopping_list_items"]["Insert"];

/** The signed-in user's shopping list. Starts empty. */
export const shoppingListStore = createMemoryStore<ShoppingItem[]>([]);

function toProduct(value: Json | null): ShoppingItem["product"] {
  return isRecord(value) && isString(value.id) && isString(value.packSize) && typeof value.price === "number"
    ? { id: value.id, packSize: value.packSize, price: value.price }
    : undefined;
}

function fromRow(row: ItemRow): ShoppingItem {
  const product = toProduct(row.product);
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity === null ? null : Number(row.quantity),
    unit: row.unit,
    aisle: AISLES.includes(row.aisle as IngredientAisle) ? (row.aisle as IngredientAisle) : "Other",
    checked: row.checked,
    sources: row.sources,
    ...(product ? { product } : {}),
  };
}

function toRow(item: ShoppingItem, userId: string): ItemInsert {
  return {
    id: item.id,
    user_id: userId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    aisle: item.aisle,
    checked: item.checked,
    sources: item.sources,
    // Product id + snapshot: ready for a future grocery catalog or store integration.
    product_id: item.product?.id ?? null,
    product: item.product ? { id: item.product.id, packSize: item.product.packSize, price: item.product.price } : null,
  };
}

async function load(supabase: RecipeNestClient, userId: string): Promise<void> {
  const { data, error } = await supabase
    .from("shopping_list_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  shoppingListStore.set(data.map(fromRow));
}

const reload = () => {
  const ctx = userContext();
  if (ctx) void load(ctx.supabase, ctx.userId).catch(() => {});
};

const changed = (a: ShoppingItem, b: ShoppingItem) => JSON.stringify(a) !== JSON.stringify(b);

/** Applies a change locally, then saves the items that were added, edited or removed. */
function commit(action: string, change: (prev: ShoppingItem[]) => ShoppingItem[]) {
  const ctx = userContext();
  if (!ctx) return;
  const prev = shoppingListStore.get();
  const next = change(prev);
  shoppingListStore.set(next);

  const before = new Map(prev.map((i) => [i.id, i]));
  const after = new Set(next.map((i) => i.id));
  const upserts = next.filter((i) => !before.has(i.id) || changed(before.get(i.id)!, i)).map((i) => toRow(i, ctx.userId));
  const removed = prev.filter((i) => !after.has(i.id)).map((i) => i.id);

  persistAll(
    action,
    async () => {
      if (removed.length) {
        const deleted = await ctx.supabase.from("shopping_list_items").delete().in("id", removed);
        if (deleted.error) return deleted;
      }
      if (upserts.length) return ctx.supabase.from("shopping_list_items").upsert(upserts, { onConflict: "id" });
    },
    reload,
  );
}

export type ShoppingItemInput = Pick<ShoppingItem, "name" | "quantity" | "unit" | "aisle">;

export interface ProductEntry {
  product: PantryProduct;
  packs: number;
  source: string;
}

export const shoppingStorage = {
  load,
  /** Adds pantry products; a product already on the list (and not yet checked off) gets more packs instead. */
  addProducts(entries: ProductEntry[]) {
    commit("add those products", (prev) => {
      const next = prev.map((i) => ({ ...i, sources: [...i.sources] }));
      for (const { product, packs, source } of entries) {
        const existing = next.find((i) => !i.checked && i.product?.id === product.id);
        if (existing) {
          existing.quantity = (existing.quantity ?? 0) + packs;
          if (!existing.sources.includes(source)) existing.sources.push(source);
        } else {
          next.unshift({
            id: newId(),
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
    commit("add that item", (prev) => [{ ...input, id: newId(), checked: false, sources: [] }, ...prev]);
  },
  update(id: string, input: ShoppingItemInput) {
    commit("update that item", (prev) => prev.map((i) => (i.id === id ? { ...i, ...input } : i)));
  },
  remove(id: string) {
    commit("remove that item", (prev) => prev.filter((i) => i.id !== id));
  },
  toggle(id: string) {
    commit("update that item", (prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
  },
  clearCompleted() {
    commit("clear checked items", (prev) => prev.filter((i) => !i.checked));
  },
  clearAll() {
    commit("clear the list", () => []);
  },
  merge(generated: ShoppingItem[]) {
    commit("add those ingredients", (prev) => mergeShoppingLists(prev, generated));
  },
};

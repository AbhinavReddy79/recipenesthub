import { useStore } from "@/lib/storage/core";
import { shoppingListStore, shoppingStorage } from "@/lib/storage/shoppingList";

export type { ShoppingItemInput } from "@/lib/storage/shoppingList";
export const shoppingActions = shoppingStorage;

export function useShoppingList() {
  const items = useStore(shoppingListStore);
  const completed = items.filter((i) => i.checked).length;
  return { items, completed, remaining: items.length - completed, ...shoppingStorage };
}

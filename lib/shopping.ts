import { scaleQuantity } from "@/lib/recipes/query";
import { createId } from "@/lib/utils";
import { DAYS, type ShoppingItem, type WeekPlan } from "@/types/mealPlan";
import type { IngredientAisle, Recipe } from "@/types/recipe";

export const AISLES: IngredientAisle[] = ["Produce", "Dairy", "Meat", "Grains", "Spices", "Other"];

const normalize = (value: string) => value.trim().toLowerCase();

/**
 * Turns a week's meal plan into an aggregated shopping list. Quantities are
 * scaled to each planned meal's servings and combined when name and unit match.
 */
export function buildShoppingList(
  plan: WeekPlan,
  recipesBySlug: Map<string, Recipe>,
): ShoppingItem[] {
  const items = new Map<string, ShoppingItem>();

  for (const day of DAYS) {
    for (const meal of Object.values(plan[day])) {
      if (!meal) continue;
      const recipe = recipesBySlug.get(meal.recipeSlug);
      if (!recipe) continue;

      for (const ingredient of recipe.ingredients) {
        const key = `${normalize(ingredient.name)}|${ingredient.unit}`;
        const quantity = scaleQuantity(ingredient.quantity, recipe.servings, meal.servings);
        const existing = items.get(key);
        if (existing) {
          existing.quantity =
            existing.quantity === null || quantity === null ? existing.quantity ?? quantity : existing.quantity + quantity;
          if (!existing.sources.includes(recipe.title)) existing.sources.push(recipe.title);
        } else {
          items.set(key, {
            id: createId("item"),
            name: ingredient.name,
            quantity,
            unit: ingredient.unit,
            aisle: ingredient.aisle,
            checked: false,
            sources: [recipe.title],
          });
        }
      }
    }
  }

  return [...items.values()]
    .map((item) => ({
      ...item,
      quantity: item.quantity === null ? null : Math.round(item.quantity * 100) / 100,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Adds generated items to an existing list, merging duplicates and keeping manual items. */
export function mergeShoppingLists(existing: ShoppingItem[], generated: ShoppingItem[]): ShoppingItem[] {
  const result = existing.map((item) => ({ ...item, sources: [...item.sources] }));
  for (const item of generated) {
    const match = result.find(
      (r) => !r.checked && normalize(r.name) === normalize(item.name) && r.unit === item.unit,
    );
    if (match) {
      if (match.quantity !== null && item.quantity !== null) {
        match.quantity = Math.round((match.quantity + item.quantity) * 100) / 100;
      }
      match.sources = [...new Set([...match.sources, ...item.sources])];
    } else {
      result.push(item);
    }
  }
  return result;
}

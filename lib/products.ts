/**
 * Product suggestions for recipes, from the RecipeNest Pantry catalog.
 * Swap `pantryProducts` for a grocery partner's API when one is connected;
 * the UI only depends on `productsForRecipe`.
 */
import { pantryProducts } from "@/data/products";
import type { PantryProduct, ProductMatch } from "@/types/product";
import type { Recipe } from "@/types/recipe";

/** Things a recipe lists that aren't bought as products. */
const NOT_PRODUCTS = new Set(["water", "cold water", "warm water", "ice"]);

const byCover = new Map<string, PantryProduct>();
for (const product of pantryProducts) for (const cover of product.covers) byCover.set(cover, product);

/** Covers sorted longest-first so "red onion" wins over "onion". */
const coversByLength = [...byCover.keys()].sort((a, b) => b.length - a.length);

function escape(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Finds the pantry product for an ingredient name, exact first, then the longest phrase it contains. */
export function findProduct(ingredientName: string): PantryProduct | null {
  const name = ingredientName.trim().toLowerCase();
  if (!name || NOT_PRODUCTS.has(name)) return null;
  const exact = byCover.get(name);
  if (exact) return exact;
  for (const cover of coversByLength) {
    if (new RegExp(`\\b${escape(cover)}(s|es)?\\b`).test(name)) return byCover.get(cover) ?? null;
  }
  return null;
}

const byId = new Map(pantryProducts.map((p) => [p.id, p]));

/** Looks up a pantry product (e.g. for a shopping-list item that stores only the id). */
export function getProduct(id: string): PantryProduct | undefined {
  return byId.get(id);
}

export interface RecipeProducts {
  matches: ProductMatch[];
  /** Ingredient names with no product in the catalog. */
  unmatched: string[];
}

/** One product per distinct item needed for the recipe (e.g. "egg" and "egg yolks" share a carton). */
export function productsForRecipe(recipe: Pick<Recipe, "ingredients">): RecipeProducts {
  const matches = new Map<string, ProductMatch>();
  const unmatched: string[] = [];
  for (const ingredient of recipe.ingredients) {
    const product = findProduct(ingredient.name);
    if (!product) {
      if (!NOT_PRODUCTS.has(ingredient.name.trim().toLowerCase())) unmatched.push(ingredient.name);
      continue;
    }
    const existing = matches.get(product.id);
    if (existing) {
      existing.ingredientLabel = `${existing.ingredientLabel}, ${ingredient.name}`;
      existing.ingredientIds.push(ingredient.id);
    } else {
      matches.set(product.id, { ingredientId: ingredient.id, ingredientIds: [ingredient.id], ingredientLabel: ingredient.name, product });
    }
  }
  return { matches: [...matches.values()], unmatched };
}

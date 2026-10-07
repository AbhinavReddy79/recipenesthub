import type { IngredientAisle } from "./recipe";

/**
 * A generic item from the RecipeNest Pantry catalog. Products are unbranded
 * and prices are estimates — there is no store connected yet.
 */
export interface PantryProduct {
  id: string;
  name: string;
  /** Pack size as sold, e.g. "250 g" or "6 ct". */
  packSize: string;
  /** Estimated price in USD for one pack. */
  price: number;
  aisle: IngredientAisle;
  /** Ingredient names this product covers (lowercase). */
  covers: string[];
  /** Product photo URL, when the catalog has one. */
  image?: string;
}

/** A product suggested for one ingredient of a recipe. */
export interface ProductMatch {
  ingredientId: string;
  /** Every recipe ingredient this product covers. */
  ingredientIds: string[];
  ingredientLabel: string;
  product: PantryProduct;
}

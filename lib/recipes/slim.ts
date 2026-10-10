import type { Recipe } from "@/types/recipe";

/*
 * Recipes handed to browser components are sent with every page, so list
 * pages get only what they show. The cooking steps and photo credits are only
 * needed on a recipe's own page, which loads the full recipe.
 */

/**
 * For cards, search and "cook with what you have": ingredient names and aisles
 * only (enough to search and to match a pantry), no steps.
 */
export function toListRecipe(recipe: Recipe): Recipe {
  return {
    ...withoutDetails(recipe),
    ingredients: recipe.ingredients.map(({ id, name, aisle }) => ({ id, name, aisle, quantity: null, unit: "" })),
  };
}

/** For views that only show recipe cards (no searching by ingredient): no ingredients or steps. */
export function toCardRecipe(recipe: Recipe): Recipe {
  return { ...withoutDetails(recipe), ingredients: [] };
}

/** For the meal planner and shopping list: full ingredients (quantities scale with servings), no steps. */
export function toPlannerRecipe(recipe: Recipe): Recipe {
  return withoutDetails(recipe);
}

function withoutDetails(recipe: Recipe): Recipe {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { imageCredit, ...rest } = recipe;
  return { ...rest, steps: [] };
}

import { regionOf } from "@/lib/cuisine-regions";
import { PLATFORM_AUTHOR } from "@/lib/site";
import type { IngredientAisle, Recipe } from "@/types/recipe";

/** [quantity, unit, name, aisle, note?] */
export type IngredientTuple = [number | null, string, string, IngredientAisle, string?];
/** Plain text, or [text, timerMinutes]. */
export type StepInput = string | [string, number];

export type RecipeInput = Omit<Recipe, "id" | "ingredients" | "steps" | "status" | "author" | "authorId" | "region"> & {
  ingredients: IngredientTuple[];
  steps: StepInput[];
};

/** Expands the compact authoring format used for the official catalog into full Recipe objects. */
export function defineRecipe(input: RecipeInput): Recipe {
  return {
    ...input,
    // The region always follows the place (one list per cuisine in lib/cuisine-regions).
    ...(input.state ? { region: regionOf(input.cuisine, input.state) } : {}),
    id: input.slug,
    status: "published",
    authorId: PLATFORM_AUTHOR.id,
    author: PLATFORM_AUTHOR,
    ingredients: input.ingredients.map(([quantity, unit, name, aisle, note], index) => ({
      id: `${input.slug}-i${index + 1}`,
      quantity,
      unit,
      name,
      aisle,
      ...(note ? { note } : {}),
    })),
    steps: input.steps.map((step, index) => {
      const [text, timerMinutes] = typeof step === "string" ? [step, undefined] : step;
      return {
        id: `${input.slug}-s${index + 1}`,
        text,
        ...(timerMinutes ? { timerMinutes } : {}),
      };
    }),
  };
}

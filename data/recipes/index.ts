import type { Recipe } from "@/types/recipe";
import { americasRecipes } from "./americas";
import { asianRecipes } from "./asian";
import { indianRecipes } from "./indian";
import { regionalIndianRecipes } from "./indian-regional";
import { italianRecipes } from "./italian";
import { mediterraneanRecipes } from "./mediterranean";

/** The community recipe catalog. Replace with a database query later. */
export const recipes: Recipe[] = [
  ...indianRecipes,
  ...regionalIndianRecipes,
  ...italianRecipes,
  ...asianRecipes,
  ...americasRecipes,
  ...mediterraneanRecipes,
];

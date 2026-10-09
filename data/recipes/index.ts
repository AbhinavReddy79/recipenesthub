import type { Recipe } from "@/types/recipe";
import { americasRecipes } from "./americas";
import { asianRecipes } from "./asian";
import { indianRecipes } from "./indian";
import { eastNortheastIndianRecipes } from "./indian-east-northeast";
import { northIndianRecipes } from "./indian-north";
import { regionalIndianRecipes } from "./indian-regional";
import { southIndianRecipes } from "./indian-south";
import { westCentralIndianRecipes } from "./indian-west-central";
import { italianRecipes } from "./italian";
import { mediterraneanRecipes } from "./mediterranean";
import { worldMealRecipes } from "./world-meals";

/** The community recipe catalog. Replace with a database query later. */
export const recipes: Recipe[] = [
  ...indianRecipes,
  ...regionalIndianRecipes,
  ...northIndianRecipes,
  ...westCentralIndianRecipes,
  ...eastNortheastIndianRecipes,
  ...southIndianRecipes,
  ...italianRecipes,
  ...asianRecipes,
  ...americasRecipes,
  ...mediterraneanRecipes,
  ...worldMealRecipes,
];

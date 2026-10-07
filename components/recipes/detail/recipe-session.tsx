"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Recipe } from "@/types/recipe";

interface RecipeSessionValue {
  recipe: Recipe;
  servings: number;
  setServings: (servings: number) => void;
  cooking: boolean;
  setCooking: (open: boolean) => void;
  /** Ingredient ids the cook already has in the kitchen. */
  have: string[];
  toggleHave: (ingredientId: string) => void;
  /** Whether "Products you will need" is expanded. */
  shopOpen: boolean;
  setShopOpen: (open: boolean) => void;
}

const RecipeSessionContext = createContext<RecipeSessionValue | null>(null);

/** Per-page state shared by the ingredient list, cooking mode and actions. */
export function RecipeSessionProvider({ recipe, children }: { recipe: Recipe; children: ReactNode }) {
  const [servings, setServingsState] = useState(recipe.servings);
  const [cooking, setCooking] = useState(false);
  const [have, setHave] = useState<string[]>([]);
  const [shopOpen, setShopOpen] = useState(false);

  const value = useMemo(
    () => ({
      recipe,
      servings,
      setServings: (next: number) => setServingsState(Math.min(48, Math.max(1, Math.round(next)))),
      cooking,
      setCooking,
      have,
      toggleHave: (id: string) => setHave((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
      shopOpen,
      setShopOpen,
    }),
    [recipe, servings, cooking, have, shopOpen],
  );

  return <RecipeSessionContext.Provider value={value}>{children}</RecipeSessionContext.Provider>;
}

export function useRecipeSession(): RecipeSessionValue {
  const ctx = useContext(RecipeSessionContext);
  if (!ctx) throw new Error("useRecipeSession must be used inside <RecipeSessionProvider>");
  return ctx;
}

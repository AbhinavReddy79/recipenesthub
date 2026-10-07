"use client";

import { Check, ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatIngredientName, formatQuantity, formatUnit } from "@/lib/format";
import { scaleQuantity } from "@/lib/recipes/query";
import { cn } from "@/lib/utils";
import { ServingsStepper } from "./detail/servings-stepper";
import { useRecipeSession } from "./detail/recipe-session";

export const PRODUCTS_SECTION_ID = "products";

/** Ingredients with live serving scaling. Tick what you already have; the rest can go on the shopping list. */
export function IngredientList() {
  const { recipe, servings, setServings, have, toggleHave, setShopOpen } = useRecipeSession();
  const missing = recipe.ingredients.length - have.length;

  const getMissing = () => {
    setShopOpen(true);
    window.setTimeout(() => {
      document.getElementById(PRODUCTS_SECTION_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <section aria-labelledby="ingredients-heading">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
        <div>
          <h2 id="ingredients-heading" className="text-[1.75rem] font-semibold">
            Ingredients
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {servings} {servings === 1 ? "serving" : "servings"}
            {servings !== recipe.servings && (
              <>
                {" · "}
                <button type="button" className="underline underline-offset-4 hover:text-foreground" onClick={() => setServings(recipe.servings)}>
                  reset to {recipe.servings}
                </button>
              </>
            )}
          </p>
        </div>
        <div data-print-hide>
          <ServingsStepper value={servings} onChange={setServings} />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground print:hidden">Tick the ones you already have.</p>
      <ul className="mt-1">
        {recipe.ingredients.map((ingredient) => {
          const quantity = scaleQuantity(ingredient.quantity, recipe.servings, servings);
          const owned = have.includes(ingredient.id);
          const amount = quantity !== null ? `${formatQuantity(quantity)}${ingredient.unit ? ` ${formatUnit(ingredient.unit, quantity)}` : ""}` : "";
          const name = formatIngredientName(ingredient.name, quantity, ingredient.unit);
          return (
            <li key={ingredient.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={owned}
                aria-label={`${amount} ${name}${ingredient.note ? `, ${ingredient.note}` : ""} — ${owned ? "I have this" : "I need this"}`}
                onClick={() => toggleHave(ingredient.id)}
                className="group grid w-full grid-cols-[1.25rem_5.5rem_1fr] items-baseline gap-x-3 border-b border-dashed py-2.5 text-left last:border-b-0"
              >
                <span
                  className={cn(
                    "flex size-[1.125rem] translate-y-0.5 items-center justify-center self-start rounded-full border-[1.5px] transition-colors print:hidden",
                    owned ? "border-herb bg-herb text-herb-foreground" : "border-input group-hover:border-herb",
                  )}
                  aria-hidden
                >
                  {owned && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span className={cn("text-right text-[0.9375rem] font-medium tabular-nums transition-colors", owned ? "text-muted-foreground" : "text-primary")}>
                  {amount}
                </span>
                <span className={cn("text-[0.9375rem] leading-snug transition-colors", owned && "text-muted-foreground line-through decoration-muted-foreground/50")}>
                  {name}
                  {ingredient.note && <span className="text-muted-foreground">, {ingredient.note}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 print:hidden">
        <p className="text-sm text-muted-foreground">
          {missing === 0 ? "You have everything." : `You need ${missing} of ${recipe.ingredients.length}.`}
        </p>
        <Button variant="outline" onClick={getMissing} disabled={missing === 0}>
          <ShoppingBasket data-icon="inline-start" />
          Get missing ingredients
        </Button>
      </div>
    </section>
  );
}

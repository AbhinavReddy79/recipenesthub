"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ShoppingBasket } from "lucide-react";
import { toast } from "sonner";
import { OrderMenu } from "@/components/shared/order-menu";
import { ProductThumb } from "@/components/shared/product-thumb";
import { RegionSelect } from "@/components/shared/region-select";
import { Button } from "@/components/ui/button";
import { useRegion } from "@/hooks/use-region";
import { useRequireUser } from "@/hooks/use-require-user";
import { shoppingActions } from "@/hooks/use-shopping-list";
import { productNeed } from "@/lib/product-quantities";
import { productsForRecipe } from "@/lib/products";
import { cn } from "@/lib/utils";
import { PRODUCTS_SECTION_ID } from "../ingredient-list";
import { ServingsStepper } from "./servings-stepper";
import { useRecipeSession } from "./recipe-session";

/**
 * Generic pantry products for the ingredients the cook still needs. Amounts
 * and costs follow the chosen servings (only what the recipe uses), and the
 * number of packs to buy is worked out from that. Folded away by default so
 * the recipe stays the focus.
 */
export function ShopIngredients() {
  const { recipe, have, shopOpen, setShopOpen, servings, setServings } = useRecipeSession();
  const router = useRouter();
  const requireUser = useRequireUser();
  const { region, price, format, packSize } = useRegion();
  const { matches, unmatched } = useMemo(() => productsForRecipe(recipe), [recipe]);

  // A product starts selected unless every ingredient it covers is ticked "I have this".
  // Choices made here override that.
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const isSelected = (m: (typeof matches)[number]) =>
    selected[m.product.id] ?? !m.ingredientIds.every((id) => have.includes(id));

  // What each product is needed for at the chosen servings.
  const needs = useMemo(
    () =>
      new Map(
        matches.map((m) => [
          m.product.id,
          productNeed(m.product, recipe.ingredients.filter((i) => m.ingredientIds.includes(i.id)), recipe.servings, servings),
        ]),
      ),
    [matches, recipe, servings],
  );
  const needOf = (id: string) => needs.get(id) ?? { amount: "", packShare: null, packs: 1 };
  /** Cost of the amount the recipe uses (a full pack when the share can't be estimated). */
  const costOf = (m: (typeof matches)[number]) => price(m.product.price) * (needOf(m.product.id).packShare ?? 1);

  const chosen = matches.filter(isSelected);
  const total = chosen.reduce((sum, m) => sum + costOf(m), 0);
  const servingsLabel = `${servings} ${servings === 1 ? "serving" : "servings"}`;
  const allSelected = chosen.length === matches.length;

  if (matches.length === 0) return null;

  const addToList = () => {
    if (!requireUser("Create a free profile to build your shopping list.")) return;
    shoppingActions.addProducts(chosen.map((m) => ({ product: m.product, packs: needOf(m.product.id).packs, source: recipe.title })));
    toast.success(`Added ${chosen.length} ${chosen.length === 1 ? "item" : "items"} to your shopping list`, {
      description: `About ${format(total)} for ${servingsLabel} (${region.name})`,
      action: { label: "View list", onClick: () => router.push("/shopping-list") },
    });
  };

  return (
    <section id={PRODUCTS_SECTION_ID} aria-labelledby="shop-heading" className="scroll-mt-24" data-print-hide>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
        <div>
          <h2 id="shop-heading" className="text-2xl font-semibold">
            Products you&apos;ll need
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {chosen.length} of {matches.length} products selected · about {format(total)} for {servingsLabel}
          </p>
        </div>
        <Button variant="ghost" onClick={() => setShopOpen(!shopOpen)} aria-expanded={shopOpen} aria-controls="products-list">
          {shopOpen ? "Hide products" : "Show products"}
          <ChevronDown className={cn("transition-transform", shopOpen && "rotate-180")} data-icon="inline-end" />
        </Button>
      </div>

      {shopOpen && (
        <div id="products-list">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground">Servings</span>
              <ServingsStepper label="Servings" size="sm" value={servings} min={1} max={48} onChange={setServings} />
            </span>
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground">Prices for</span>
              <RegionSelect className="h-8 w-auto max-w-60 text-sm" />
            </span>
            <button
              type="button"
              className="ml-auto underline-offset-4 hover:underline"
              onClick={() => setSelected(Object.fromEntries(matches.map((m) => [m.product.id, !allSelected])))}
            >
              {allSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          <ul className="divide-y border-y">
            {matches.map((match) => {
              const { product, ingredientLabel } = match;
              const on = isSelected(match);
              const need = needOf(product.id);
              return (
                <li key={product.id} className="group flex items-center gap-3 py-3">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-label={`${on ? "Remove" : "Include"} ${product.name}`}
                    onClick={() => setSelected((s) => ({ ...s, [product.id]: !on }))}
                    className={cn(
                      "flex size-[1.125rem] shrink-0 items-center justify-center rounded-[4px] border transition-colors",
                      on ? "border-primary bg-primary text-primary-foreground" : "border-input hover:border-foreground/50",
                    )}
                  >
                    {on && (
                      <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                        <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                  <ProductThumb name={product.name} image={product.image} aisle={product.aisle} className={cn(!on && "opacity-50 grayscale")} />
                  <div className={cn("grid min-w-0 flex-1", !on && "opacity-50")}>
                    <p className="truncate text-[0.9375rem] font-medium">{product.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{need.amount}</span> {ingredientLabel} · for {servingsLabel}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Sold as {packSize(product.packSize)} · buy {need.packs} {need.packs === 1 ? "pack" : "packs"}
                    </p>
                  </div>
                  <div className={cn("grid shrink-0 justify-items-end", !on && "opacity-40")}>
                    <span className="text-sm font-medium tabular-nums">{format(costOf(match))}</span>
                    <span className="text-[0.6875rem] text-muted-foreground">
                      {need.packShare === null ? "per pack" : "for this recipe"}
                    </span>
                  </div>
                  <OrderMenu item={product.name} compact />
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <p>
              <span className="font-display text-2xl font-semibold tabular-nums">{format(total)}</span>{" "}
              <span className="text-sm text-muted-foreground">estimated for {servingsLabel}</span>
            </p>
            <Button onClick={addToList} disabled={chosen.length === 0}>
              <ShoppingBasket data-icon="inline-start" />
              Add {chosen.length} to shopping list
            </Button>
          </div>
          {unmatched.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">Not in the pantry catalog yet: {unmatched.join(", ")}.</p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Generic products with typical prices for {region.name}. Costs cover the amount this recipe uses at the
            chosen servings; packs to buy are rounded up. Estimates only — nothing is charged. The cart icon
            opens a store&apos;s own search in a new tab; RecipeNest isn&apos;t affiliated with these stores.
          </p>
        </div>
      )}
    </section>
  );
}

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
import { productsForRecipe } from "@/lib/products";
import { cn } from "@/lib/utils";
import { PRODUCTS_SECTION_ID } from "../ingredient-list";
import { ServingsStepper } from "./servings-stepper";
import { useRecipeSession } from "./recipe-session";

/**
 * Generic pantry products for the ingredients the cook still needs, with an
 * estimated total. Folded away by default so the recipe stays the focus.
 */
export function ShopIngredients() {
  const { recipe, have, shopOpen, setShopOpen } = useRecipeSession();
  const router = useRouter();
  const requireUser = useRequireUser();
  const { region, price, format, packSize } = useRegion();
  const { matches, unmatched } = useMemo(() => productsForRecipe(recipe), [recipe]);

  // A product starts selected unless every ingredient it covers is ticked "I have this".
  // Choices made here override that.
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [packs, setPacks] = useState<Record<string, number>>({});
  const isSelected = (m: (typeof matches)[number]) =>
    selected[m.product.id] ?? !m.ingredientIds.every((id) => have.includes(id));
  const packsOf = (id: string) => packs[id] ?? 1;

  const chosen = matches.filter(isSelected);
  const total = chosen.reduce((sum, m) => sum + price(m.product.price) * packsOf(m.product.id), 0);
  const allSelected = chosen.length === matches.length;

  if (matches.length === 0) return null;

  const addToList = () => {
    if (!requireUser("Create a free profile to build your shopping list.")) return;
    shoppingActions.addProducts(chosen.map((m) => ({ product: m.product, packs: packsOf(m.product.id), source: recipe.title })));
    toast.success(`Added ${chosen.length} ${chosen.length === 1 ? "item" : "items"} to your shopping list`, {
      description: `Estimated ${format(total)} (${region.name})`,
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
            {chosen.length} of {matches.length} products selected · about {format(total)}
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
            <span className="text-muted-foreground">Prices for</span>
            <RegionSelect className="h-8 w-auto max-w-60 text-sm" />
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
              const count = packsOf(product.id);
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
                      {packSize(product.packSize)} · for {ingredientLabel}
                    </p>
                  </div>
                  <div className={cn("flex shrink-0 items-center gap-2 sm:gap-3", !on && "pointer-events-none opacity-40")}>
                    <ServingsStepper
                      label={`Packs of ${product.name}`}
                      size="sm"
                      value={count}
                      min={1}
                      max={12}
                      onChange={(v) => setPacks((p) => ({ ...p, [product.id]: Math.max(1, Math.min(12, v)) }))}
                    />
                    <span className="w-16 text-right text-sm font-medium tabular-nums">{format(price(product.price) * count)}</span>
                  </div>
                  <OrderMenu item={product.name} compact />
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <p>
              <span className="font-display text-2xl font-semibold tabular-nums">{format(total)}</span>{" "}
              <span className="text-sm text-muted-foreground">estimated</span>
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
            Generic products with typical prices for {region.name}. Estimates only — nothing is charged. The cart icon
            opens a store&apos;s own search in a new tab; RecipeNest isn&apos;t affiliated with these stores.
          </p>
        </div>
      )}
    </section>
  );
}

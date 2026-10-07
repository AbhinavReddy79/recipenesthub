"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Plus, Refrigerator, X } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCatalog } from "@/hooks/use-catalog";
import { matchRecipesByIngredients } from "@/lib/recipes/query";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";
import { RecipeCard } from "./recipe-card";

const GROUPS: Array<{ label: string; items: string[] }> = [
  { label: "Essentials", items: ["Chicken", "Tomato", "Onion", "Garlic", "Potato", "Egg", "Rice"] },
  { label: "Proteins", items: ["Beef", "Shrimp", "Salmon", "Pork", "Paneer", "Tofu", "Chickpeas", "Lentils"] },
  { label: "Produce", items: ["Lemon", "Lime", "Avocado", "Spinach", "Carrot", "Bell pepper", "Mushroom", "Ginger", "Cilantro"] },
  { label: "Dairy & pantry", items: ["Butter", "Cheese", "Milk", "Yogurt", "Cream", "Pasta", "Noodles", "Flour", "Coconut milk", "Bread"] },
];

function matchTone(percent: number) {
  if (percent >= 80) return "bg-herb text-herb-foreground";
  if (percent >= 50) return "bg-saffron text-neutral-900";
  return "bg-background/90 text-foreground";
}

export function IngredientMatcher({ recipes: serverRecipes }: { recipes: Recipe[] }) {
  const { recipes } = useCatalog(serverRecipes);
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<string[]>(() =>
    (searchParams.get("have") ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
  const [assumePantry, setAssumePantry] = useState(true);
  const [custom, setCustom] = useState("");

  const update = (next: string[]) => {
    setSelected(next);
    const query = next.length ? `?have=${next.map(encodeURIComponent).join(",")}` : "";
    window.history.replaceState(null, "", `/ingredients${query}`);
  };

  const toggle = (item: string) => {
    const key = item.toLowerCase();
    update(selected.includes(key) ? selected.filter((s) => s !== key) : [...selected, key]);
  };

  const addCustom = (event: FormEvent) => {
    event.preventDefault();
    const key = custom.trim().toLowerCase();
    if (key && !selected.includes(key)) update([...selected, key]);
    setCustom("");
  };

  const matches = useMemo(
    () => matchRecipesByIngredients(recipes, selected, assumePantry).slice(0, 24),
    [recipes, selected, assumePantry],
  );
  const knownItems = GROUPS.flatMap((g) => g.items.map((i) => i.toLowerCase()));
  const customSelected = selected.filter((s) => !knownItems.includes(s));

  return (
    <div className="container-page grid gap-12 pt-10 pb-24 lg:grid-cols-[360px_1fr] lg:gap-14">
      <aside aria-label="Your ingredients" className="lg:sticky lg:top-24 lg:self-start">
        <div className="grid gap-6 rounded-2xl border bg-card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-sans text-base font-semibold tracking-normal">
              Your ingredients{" "}
              <span className="font-normal text-muted-foreground">({selected.length})</span>
            </h2>
            {selected.length > 0 && (
              <button type="button" onClick={() => update([])} className="text-sm font-medium text-primary hover:underline">
                Clear
              </button>
            )}
          </div>

          <form onSubmit={addCustom} className="flex gap-2">
            <Label htmlFor="custom-ingredient" className="sr-only">
              Add another ingredient
            </Label>
            <Input
              id="custom-ingredient"
              placeholder="Add another, e.g. corn"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
            />
            <Button type="submit" variant="outline" size="icon" className="size-10 shrink-0" aria-label="Add ingredient">
              <Plus />
            </Button>
          </form>

          {customSelected.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customSelected.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(item)}
                  className="inline-flex items-center gap-1 rounded-full bg-primary py-1 pr-2 pl-3 text-sm font-medium text-primary-foreground capitalize"
                  aria-label={`Remove ${item}`}
                >
                  {item}
                  <X className="size-3.5" aria-hidden />
                </button>
              ))}
            </div>
          )}

          {GROUPS.map((group) => (
            <fieldset key={group.label} className="grid gap-2.5">
              <legend className="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {group.label}
              </legend>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const active = selected.includes(item.toLowerCase());
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(item)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-background hover:border-primary/40 hover:bg-accent",
                      )}
                    >
                      {active && <Check className="size-3.5" aria-hidden />}
                      {item}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="flex items-start justify-between gap-4 rounded-xl bg-surface p-3.5">
            <Label htmlFor="assume-pantry" className="grid gap-0.5 text-sm font-medium">
              I have pantry staples
              <span className="text-xs font-normal text-muted-foreground">Salt, oil, sugar and spices</span>
            </Label>
            <Switch id="assume-pantry" checked={assumePantry} onCheckedChange={setAssumePantry} />
          </div>
        </div>
      </aside>

      <section aria-labelledby="matches-heading" aria-live="polite">
        {selected.length === 0 ? (
          <EmptyState
            icon={Refrigerator}
            title="Tell us what's in your kitchen"
            description="Pick a few ingredients and we'll find recipes you can make right now, ranked by how much you already have."
          />
        ) : matches.length === 0 ? (
          <EmptyState
            icon={Refrigerator}
            title="No matches yet"
            description="None of our recipes use those ingredients. Try adding a staple like chicken, rice or tomato."
          />
        ) : (
          <>
            <div className="mb-8 grid gap-1">
              <h2 id="matches-heading" className="text-3xl font-semibold">
                You can make these recipes.
              </h2>
              <p className="text-muted-foreground">
                {matches.length} recipes use what you have — best matches first.
              </p>
            </div>
            <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {matches.map(({ recipe, percent, missing }) => (
                <li key={recipe.slug} className="flex flex-col">
                  <RecipeCard
                    recipe={recipe}
                    showDescription={false}
                    sizes="(min-width: 1280px) 22vw, (min-width: 640px) 40vw, 92vw"
                    badge={
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold shadow-soft", matchTone(percent))}>
                        {percent}% ingredients available
                      </span>
                    }
                  />
                  <div className="mt-3 rounded-lg bg-surface px-3 py-2.5 text-[0.8125rem]">
                    <div
                      className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${percent}% of ingredients available`}
                    >
                      <div className="h-full rounded-full bg-herb" style={{ width: `${percent}%` }} />
                    </div>
                    {missing.length === 0 ? (
                      <p className="font-medium text-success">You have everything you need!</p>
                    ) : (
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Missing {missing.length}:</span>{" "}
                        {missing
                          .slice(0, 4)
                          .map((m) => m.name)
                          .join(", ")}
                        {missing.length > 4 && ` +${missing.length - 4} more`}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}

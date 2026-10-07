"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, Heart, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFavorites } from "@/hooks/use-favorites";
import { formatMinutes } from "@/lib/format";
import { CUISINE_LABELS } from "@/lib/labels";
import { searchRecipes, sortRecipes, totalMinutes } from "@/lib/recipes/query";
import { cn } from "@/lib/utils";
import type { MealType, Recipe } from "@/types/recipe";

interface RecipePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipes: Recipe[];
  title: string;
  description?: string;
  onPick: (recipe: Recipe) => void;
  isSelected?: (recipe: Recipe) => boolean;
  /** Prefer recipes of this meal type (shown first). */
  preferMealType?: MealType;
  actionLabel?: string;
}

export function RecipePickerDialog(props: RecipePickerDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="flex max-h-[min(88dvh,720px)] flex-col gap-0 p-0 sm:max-w-xl">
        {props.open && <PickerBody {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function PickerBody({
  recipes,
  title,
  description,
  onPick,
  isSelected,
  preferMealType,
  actionLabel = "Add",
}: RecipePickerDialogProps) {
  const [query, setQuery] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const { slugs } = useFavorites();

  const results = useMemo(() => {
    let list = query ? searchRecipes(recipes, query) : sortRecipes(recipes, "featured");
    if (onlySaved) list = list.filter((r) => slugs.includes(r.slug));
    if (preferMealType && !query) {
      list = [...list.filter((r) => r.mealType === preferMealType), ...list.filter((r) => r.mealType !== preferMealType)];
    }
    return list.slice(0, 40);
  }, [recipes, query, onlySaved, slugs, preferMealType]);

  return (
    <>
      <DialogHeader className="border-b p-5 pb-4">
        <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              autoFocus
              type="search"
              aria-label="Search recipes"
              placeholder="Search recipes…"
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button
            variant={onlySaved ? "default" : "outline"}
            className="h-10"
            aria-pressed={onlySaved}
            onClick={() => setOnlySaved((v) => !v)}
          >
            <Heart className={cn(onlySaved && "fill-current")} />
            Saved
          </Button>
        </div>
      </DialogHeader>
      <ul className="flex-1 divide-y overflow-y-auto px-2 py-1" aria-label="Recipes">
        {results.length === 0 && (
          <li className="px-3 py-10 text-center text-sm text-muted-foreground">No recipes match “{query}”.</li>
        )}
        {results.map((recipe) => {
          const selected = isSelected?.(recipe) ?? false;
          return (
            <li key={recipe.slug} className="flex items-center gap-3 px-2 py-2.5">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={recipe.image} alt="" fill sizes="56px" className="object-cover" />
              </span>
              <span className="grid min-w-0 flex-1">
                <span className="truncate font-medium">{recipe.title}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {CUISINE_LABELS[recipe.cuisine]} · {recipe.mealType} · {formatMinutes(totalMinutes(recipe))}
                </span>
              </span>
              <Button
                size="sm"
                variant={selected ? "secondary" : "outline"}
                onClick={() => onPick(recipe)}
                aria-label={`${selected ? "Remove" : actionLabel} ${recipe.title}`}
              >
                {selected ? <Check /> : <Plus />}
                {selected ? "Added" : actionLabel}
              </Button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

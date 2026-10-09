import type { LucideIcon } from "lucide-react";
import { CakeSlice, Cookie, CupSoda, Moon, Sun, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MealType, Recipe } from "@/types/recipe";
import { RecipeGrid } from "./recipe-grid";

export const MEALS: { type: MealType; label: string; id: string; icon: LucideIcon; tone: string }[] = [
  { type: "Breakfast", label: "Breakfast", id: "breakfast", icon: Sunrise, tone: "amber" },
  { type: "Lunch", label: "Lunch", id: "lunch", icon: Sun, tone: "herb" },
  { type: "Snack", label: "Snacks", id: "snacks", icon: Cookie, tone: "coral" },
  { type: "Dinner", label: "Dinner", id: "dinner", icon: Moon, tone: "ocean" },
  { type: "Dessert", label: "Desserts", id: "desserts", icon: CakeSlice, tone: "berry" },
  { type: "Drink", label: "Drinks", id: "drinks", icon: CupSoda, tone: "brand" },
];

/** Recipes grouped by the part of the day they're eaten (empty meals are left out). */
export function groupByMeal(recipes: Recipe[]) {
  return MEALS.map((meal) => ({
    ...meal,
    recipes: recipes.filter((r) => r.mealType === meal.type).sort((a, b) => b.editorScore - a.editorScore),
  })).filter((group) => group.recipes.length > 0);
}

/** Jump links to each meal section, with counts. */
export function MealJumpLinks({ groups, className }: { groups: ReturnType<typeof groupByMeal>; className?: string }) {
  return (
    <nav aria-label="Meals" className={cn("-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0", className)}>
      <ul className="flex gap-2">
        {groups.map(({ id, label, icon: Icon, recipes, tone }) => (
          <li key={id} data-tone={tone}>
            <a
              href={`#${id}`}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium whitespace-nowrap shadow-soft transition-colors hover:border-tone hover:text-tone"
            >
              <Icon className="size-4 text-tone" aria-hidden />
              {label}
              <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">{recipes.length}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** One section per meal: Breakfast, Lunch, Snacks, Dinner, then Desserts and Drinks. */
export function MealSections({ recipes, emptyText }: { recipes: Recipe[]; emptyText?: string }) {
  const groups = groupByMeal(recipes);
  if (groups.length === 0) {
    return <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">{emptyText ?? "No recipes yet."}</p>;
  }
  return (
    <div className="grid gap-14">
      <MealJumpLinks groups={groups} />
      {groups.map(({ id, label, icon: Icon, recipes: list, tone }) => (
        <section key={id} id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-28" data-tone={tone}>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-tone text-tone-foreground shadow-soft">
              <Icon className="size-5" aria-hidden />
            </span>
            <h3 id={`${id}-heading`} className="text-[1.75rem] leading-tight font-semibold">
              {label}
            </h3>
            <span className="text-sm text-muted-foreground">
              {list.length} {list.length === 1 ? "recipe" : "recipes"}
            </span>
          </div>
          <RecipeGrid recipes={list} />
        </section>
      ))}
    </div>
  );
}

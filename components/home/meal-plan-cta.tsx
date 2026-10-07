import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Check, ShoppingBasket } from "lucide-react";
import { Eyebrow } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { DAYS, type WeekPlan } from "@/types/mealPlan";
import type { Recipe } from "@/types/recipe";

const POINTS = [
  "Drag recipes onto any day of the week",
  "Ingredients add up into one list, sorted by aisle",
];

/** Always-dark band (the `dark` class scopes the dark tokens to this section). */
export function MealPlanCta({ plan, recipes }: { plan: WeekPlan; recipes: Map<string, Recipe> }) {
  return (
    <section aria-labelledby="meal-plan-cta" className="dark band-charcoal relative isolate overflow-hidden bg-ink text-foreground">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(45%_70%_at_88%_15%,color-mix(in_oklch,var(--saffron)_16%,transparent),transparent),radial-gradient(40%_60%_at_5%_100%,color-mix(in_oklch,var(--saffron)_8%,transparent),transparent)]"
      />

      <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:py-24 [&>*]:min-w-0">
        <div className="grid gap-5">
          <Eyebrow>Meal planner</Eyebrow>
          <h2 id="meal-plan-cta" className="text-balance text-[2.25rem] leading-[1.08] font-semibold sm:text-5xl">
            Plan the week, then shop once.
          </h2>
          <p className="max-w-md text-pretty text-lg text-muted-foreground">
            Pick dinners for the week and RecipeNest adds up the ingredients into one shopping list, sorted by aisle.
          </p>
          <ul className="grid gap-2.5">
            {POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 text-[0.9375rem]">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3.5" strokeWidth={3} aria-hidden />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/meal-planner">
                <CalendarDays data-icon="inline-start" />
                Start planning
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/shopping-list">
                <ShoppingBasket data-icon="inline-start" />
                Open shopping list
              </Link>
            </Button>
          </div>
        </div>

        <div aria-label="Example weekly meal plan" className="rounded-3xl bg-card p-4 shadow-2xl ring-1 ring-border sm:p-6">
          <div className="mb-3 flex items-center justify-between px-1">
            <p className="font-display text-lg font-semibold">An example week</p>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Dinners</span>
          </div>
          <ul data-reveal-grid className="grid gap-1.5">
            {DAYS.map((day) => {
              const meal = plan[day].Dinner ?? plan[day].Lunch ?? plan[day].Breakfast;
              const recipe = meal ? recipes.get(meal.recipeSlug) : undefined;
              return (
                <li key={day} className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted sm:gap-4">
                  <span className="w-11 shrink-0 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    <span aria-hidden>{day.slice(0, 3)}</span>
                    <span className="sr-only">{day}</span>
                  </span>
                  {recipe ? (
                    <>
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image src={recipe.image} alt="" fill sizes="44px" className="object-cover" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium">{recipe.title}</span>
                    </>
                  ) : (
                    <>
                      <span className="size-11 shrink-0 rounded-lg border border-dashed" aria-hidden />
                      <span className="text-[0.9375rem] text-muted-foreground italic">Leftovers</span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

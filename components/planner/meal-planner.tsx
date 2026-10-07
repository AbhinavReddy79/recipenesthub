"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CalendarPlus, Eraser, ShoppingBasket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RecipePickerDialog } from "@/components/recipes/recipe-picker-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCatalog } from "@/hooks/use-catalog";
import { useHydrated } from "@/hooks/use-hydrated";
import { mealPlanActions, useMealPlan, type SlotRef } from "@/hooks/use-meal-plan";
import { shoppingActions } from "@/hooks/use-shopping-list";
import { useSettings } from "@/hooks/use-settings";
import { buildShoppingList } from "@/lib/shopping";
import { cn } from "@/lib/utils";
import { DAYS, MEAL_SLOTS, type DayOfWeek } from "@/types/mealPlan";
import type { Recipe } from "@/types/recipe";
import { MealSlot, SLOT_TONE } from "./meal-slot";
import { MoveMealDialog } from "./move-meal-dialog";
import { WeeklySummary } from "./weekly-summary";

/** Today's weekday name, used to start planning from today. */
function today(): DayOfWeek {
  return DAYS[(new Date().getDay() + 6) % 7];
}

export function MealPlanner({ recipes: serverRecipes }: { recipes: Recipe[] }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const { plan, mealCount } = useMealPlan();
  const { recipes, bySlug } = useCatalog(serverRecipes);
  const { settings } = useSettings();
  const [picking, setPicking] = useState<SlotRef | null>(null);
  const [moving, setMoving] = useState<SlotRef | null>(null);

  const generateList = () => {
    const items = buildShoppingList(plan, bySlug);
    shoppingActions.merge(items);
    toast.success(`Added ${items.length} ingredients to your shopping list`, {
      action: { label: "Open list", onClick: () => router.push("/shopping-list") },
    });
  };

  const dayCalories = (day: DayOfWeek) =>
    Object.values(plan[day]).reduce((sum, meal) => {
      const recipe = meal ? bySlug.get(meal.recipeSlug) : undefined;
      return sum + (recipe?.nutrition.calories ?? 0);
    }, 0);

  if (!hydrated) {
    return (
      <div role="status" aria-label="Loading meal plan" className="grid gap-3 lg:grid-cols-7">
        {DAYS.map((d) => (
          <Skeleton key={d} className="h-80 rounded-2xl" />
        ))}
      </div>
    );
  }

  const slotProps = (day: DayOfWeek, slot: (typeof MEAL_SLOTS)[number]) => {
    const meal = plan[day][slot];
    return {
      slotRef: { day, slot },
      meal,
      recipe: meal ? bySlug.get(meal.recipeSlug) : undefined,
      onAdd: setPicking,
      onMove: setMoving,
    };
  };

  const toolbar = (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card p-3 pl-5 shadow-card">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{mealCount}</span> {mealCount === 1 ? "meal" : "meals"} planned this week
        <span className="hidden md:inline"> · drag meals between slots to rearrange</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" disabled={mealCount === 0}>
              <Trash2 />
              Clear week
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear the whole week?</AlertDialogTitle>
              <AlertDialogDescription>All {mealCount} planned meals will be removed. Your shopping list is not affected.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => mealPlanActions.clearWeek()}>
                Clear week
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={generateList} disabled={mealCount === 0}>
          <ShoppingBasket />
          Generate shopping list
        </Button>
      </div>
    </div>
  );

  const movingMeal = moving ? plan[moving.day][moving.slot] : undefined;

  return (
    <div className="grid gap-6">
      {toolbar}

      {mealCount > 0 && <WeeklySummary plan={plan} bySlug={bySlug} showReminder={settings.notifications.mealPlanReminders} />}

      {mealCount === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Plan your first week."
          description="Pick recipes for breakfast, lunch, dinner and snacks — then turn the week into a shopping list in one click."
          actions={
            <Button size="lg" onClick={() => setPicking({ day: today(), slot: "Dinner" })}>
              <CalendarPlus data-icon="inline-start" />
              Start Planning
            </Button>
          }
        />
      ) : null}

      {/* Desktop board */}
      <div className="hidden overflow-x-auto pb-2 lg:block">
        <div className="grid min-w-[1100px] grid-cols-[5.5rem_repeat(7,minmax(0,1fr))] gap-2.5">
          <div />
          {DAYS.map((day) => (
            <div
              key={day}
              className={cn(
                "flex items-center justify-between gap-1 rounded-xl px-2 py-1.5",
                day === today() && "bg-primary/10 ring-1 ring-primary/25",
              )}
            >
              <div>
                <p className="flex items-center gap-1.5 font-display text-base font-semibold">
                  {day.slice(0, 3)}
                  {day === today() && (
                    <span className="rounded-full bg-primary px-1.5 py-px font-sans text-[0.625rem] font-bold tracking-wide text-primary-foreground uppercase">
                      Today
                    </span>
                  )}
                </p>
                <p className="text-[0.6875rem] text-muted-foreground tabular-nums">{dayCalories(day) ? `${dayCalories(day)} kcal` : "—"}</p>
              </div>
              {Object.keys(plan[day]).length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" onClick={() => mealPlanActions.clearDay(day)} aria-label={`Clear ${day}`}>
                      <Eraser />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear {day}</TooltipContent>
                </Tooltip>
              )}
            </div>
          ))}
          {MEAL_SLOTS.map((slot) => (
            <div key={slot} className="contents">
              <div data-tone={SLOT_TONE[slot]} className="flex items-start gap-1.5 pt-3 text-xs font-bold tracking-wider text-tone uppercase">
                <span aria-hidden className="mt-1 size-2 shrink-0 rounded-full bg-tone" />
                {slot}
              </div>
              {DAYS.map((day) => (
                <div key={`${day}-${slot}`} className="min-h-36">
                  <MealSlot {...slotProps(day, slot)} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile & tablet: one card per day */}
      <ol className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {DAYS.map((day) => (
          <li key={day} className={cn("rounded-2xl border bg-card p-4 shadow-card", day === today() && "ring-2 ring-primary/40")}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                {day}
                {day === today() && (
                  <span className="rounded-full bg-primary px-2 py-0.5 font-sans text-[0.6875rem] font-bold tracking-wide text-primary-foreground uppercase">
                    Today
                  </span>
                )}
              </h2>
              {Object.keys(plan[day]).length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => mealPlanActions.clearDay(day)}>
                  <Eraser />
                  Clear day
                </Button>
              )}
            </div>
            <ul className="grid gap-2.5">
              {MEAL_SLOTS.map((slot) => (
                <li key={slot} data-tone={SLOT_TONE[slot]} className="grid gap-1.5">
                  <span className="flex items-center gap-1.5 text-[0.6875rem] font-bold tracking-wider text-tone uppercase">
                    <span aria-hidden className="size-1.5 rounded-full bg-tone" />
                    {slot}
                  </span>
                  <MealSlot {...slotProps(day, slot)} compact />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <RecipePickerDialog
        open={picking !== null}
        onOpenChange={(open) => !open && setPicking(null)}
        recipes={recipes}
        title={picking ? `${picking.day} · ${picking.slot}` : "Pick a recipe"}
        description="Choose a recipe for this slot."
        actionLabel="Choose"
        preferMealType={picking?.slot}
        isSelected={(r) => (picking ? plan[picking.day][picking.slot]?.recipeSlug === r.slug : false)}
        onPick={(recipe) => {
          if (!picking) return;
          const current = plan[picking.day][picking.slot];
          mealPlanActions.assign(picking, recipe.slug, current?.servings ?? settings.preferences.defaultServings);
          toast.success(`${recipe.title} added to ${picking.day}`);
          setPicking(null);
        }}
      />
      <MoveMealDialog
        from={moving}
        plan={plan}
        recipeTitle={movingMeal ? bySlug.get(movingMeal.recipeSlug)?.title : undefined}
        onOpenChange={(open) => !open && setMoving(null)}
      />
    </div>
  );
}

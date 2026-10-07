import Link from "next/link";
import { BellRing, ChefHat, Flame, Timer, UtensilsCrossed } from "lucide-react";
import { formatMinutes } from "@/lib/format";
import { totalMinutes } from "@/lib/recipes/query";
import { DAYS, MEAL_SLOTS, type WeekPlan } from "@/types/mealPlan";
import type { Recipe } from "@/types/recipe";

interface WeeklySummaryProps {
  plan: WeekPlan;
  bySlug: Map<string, Recipe>;
  showReminder: boolean;
}

export function WeeklySummary({ plan, bySlug, showReminder }: WeeklySummaryProps) {
  const meals = DAYS.flatMap((day) =>
    Object.values(plan[day]).flatMap((meal) => {
      const recipe = meal ? bySlug.get(meal.recipeSlug) : undefined;
      return recipe ? [{ day, recipe }] : [];
    }),
  );
  const plannedDays = DAYS.filter((day) => Object.keys(plan[day]).length > 0);
  const noDinner = DAYS.filter((day) => !plan[day].Dinner);
  const unique = new Set(meals.map((m) => m.recipe.slug)).size;
  const cookTime = meals.reduce((sum, m) => sum + totalMinutes(m.recipe), 0);
  const calories = meals.reduce((sum, m) => sum + m.recipe.nutrition.calories, 0);
  const avgCalories = plannedDays.length ? Math.round(calories / plannedDays.length) : 0;

  const stats = [
    { label: "Meals planned", value: `${meals.length} / ${DAYS.length * MEAL_SLOTS.length}`, icon: UtensilsCrossed, tone: "herb" },
    { label: "Different recipes", value: String(unique), icon: ChefHat, tone: "berry" },
    { label: "Total cooking time", value: cookTime ? formatMinutes(cookTime) : "—", icon: Timer, tone: "ocean" },
    { label: "Avg. per planned day", value: avgCalories ? `${avgCalories.toLocaleString("en-US")} kcal` : "—", icon: Flame, tone: "coral" },
  ];

  return (
    <section aria-labelledby="week-summary" className="grid gap-3">
      <h2 id="week-summary" className="sr-only">
        Weekly summary
      </h2>
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            data-tone={tone}
            className="group flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-4"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-tone text-tone-foreground shadow-soft transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 sm:size-11">
              <Icon className="size-4.5" aria-hidden />
            </span>
            <div className="min-w-0">
              <dt className="text-xs leading-snug text-muted-foreground">{label}</dt>
              <dd className="font-display text-base leading-tight font-semibold tabular-nums sm:text-lg">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
      {showReminder && meals.length > 0 && noDinner.length > 0 && (
        <p role="status" className="flex flex-wrap items-center gap-2 rounded-xl border border-saffron/40 bg-saffron/10 px-4 py-3 text-sm">
          <BellRing className="size-4 shrink-0 text-saffron" aria-hidden />
          <span>
            <strong>{noDinner.length === 1 ? "1 day still needs" : `${noDinner.length} days still need`} a dinner:</strong>{" "}
            {noDinner.join(", ")}.
          </span>
          <Link href="/settings#notifications" className="ml-auto text-xs font-medium text-muted-foreground underline-offset-4 hover:underline">
            Reminder settings
          </Link>
        </p>
      )}
    </section>
  );
}

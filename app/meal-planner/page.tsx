import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { RequireProfile } from "@/components/auth/require-profile";
import { MealPlanner } from "@/components/planner/meal-planner";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import { listRecipes } from "@/lib/services/recipes";
import { toPlannerRecipe } from "@/lib/recipes/slim";

export const metadata: Metadata = {
  title: "Meal Planner",
  description: "Plan your week of breakfasts, lunches, dinners and snacks, then turn it into a shopping list.",
  alternates: { canonical: "/meal-planner" },
};

export default async function MealPlannerPage() {
  const recipes = (await listRecipes()).map(toPlannerRecipe);
  return (
    <ModuleTone tone="herb">
      <PageHeader
        icon={<CalendarDays />}
        eyebrow="Meal planner"
        title="Plan your week"
        description="Assign recipes to each day, move things around, and generate a shopping list in one click."
      />
      <div className="container-page py-10 pb-24 lg:max-w-[90rem]">
        <RequireProfile
          icon={<CalendarDays />}
          title="Plan your week, cook with less stress"
          description="Create a free profile to plan breakfasts, lunches and dinners — and turn them into a shopping list."
        >
          <MealPlanner recipes={recipes} />
        </RequireProfile>
      </div>
    </ModuleTone>
  );
}

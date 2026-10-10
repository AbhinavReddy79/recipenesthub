import type { Metadata } from "next";
import { Carrot } from "lucide-react";
import { Suspense } from "react";
import { IngredientMatcher } from "@/components/recipes/ingredient-matcher";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import { RecipeGridSkeleton } from "@/components/shared/skeletons";
import { listRecipes } from "@/lib/services/recipes";
import { toListRecipe } from "@/lib/recipes/slim";

export const metadata: Metadata = {
  title: "Cook With What You Have",
  description:
    "Pick the ingredients in your kitchen and RecipeNest shows recipes you can make right now, with a match score for each.",
  alternates: { canonical: "/ingredients" },
};

export default async function IngredientsPage() {
  const recipes = (await listRecipes()).map(toListRecipe);
  return (
    <ModuleTone tone="herb">
      <PageHeader
        icon={<Carrot />}
        eyebrow="Ingredient search"
        title="What ingredients do you have?"
        description="Select what's in your fridge and pantry. We'll rank recipes by how many ingredients you already have."
      />
      <Suspense
        fallback={
          <div className="container-page py-16">
            <RecipeGridSkeleton count={6} columns={3} />
          </div>
        }
      >
        <IngredientMatcher recipes={recipes} />
      </Suspense>
    </ModuleTone>
  );
}

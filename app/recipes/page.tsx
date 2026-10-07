import type { Metadata } from "next";
import { Suspense } from "react";
import { DiscoverView } from "@/components/recipes/discover-view";
import { Eyebrow } from "@/components/shared/section-heading";
import { RecipeGridSkeleton } from "@/components/shared/skeletons";
import { listRecipes } from "@/lib/services/recipes";

export const metadata: Metadata = {
  title: "Discover Recipes",
  description:
    "Find something delicious for every occasion. Filter recipes by cuisine, diet, meal type, difficulty and cooking time.",
  alternates: { canonical: "/recipes" },
  openGraph: {
    title: "Discover Recipes · RecipeNest",
    description: "Find something delicious for every occasion.",
    url: "/recipes",
  },
};

export default async function DiscoverPage() {
  const recipes = await listRecipes();

  return (
    <>
      <header className="relative isolate overflow-hidden border-b bg-warm-glow">
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-dots [mask-image:linear-gradient(to_left,black,transparent)]"
        />
        <div className="container-page pt-12 pb-16 sm:pt-16 sm:pb-20">
          <Eyebrow>{recipes.length}+ tested recipes</Eyebrow>
          <h1 className="mt-3 text-[2.5rem] leading-[1.06] font-semibold sm:text-6xl">Discover Recipes</h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">Find something delicious for every occasion.</p>
        </div>
      </header>
      <Suspense
        fallback={
          <div className="container-page py-24">
            <RecipeGridSkeleton count={6} columns={3} />
          </div>
        }
      >
        <DiscoverView recipes={recipes} />
      </Suspense>
    </>
  );
}

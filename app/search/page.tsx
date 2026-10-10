import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchView } from "@/components/recipes/search-view";
import { RecipeGridSkeleton } from "@/components/shared/skeletons";
import { listRecipes } from "@/lib/services/recipes";
import { toListRecipe } from "@/lib/recipes/slim";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 80) : "";
  const title = query ? `Recipes for “${query}”` : "Search recipes";
  const description = query
    ? `Browse recipes matching “${query}” by title, ingredient, cuisine and diet on RecipeNest.`
    : "Search thousands of recipes by title, ingredient, cuisine, category and dietary tag.";
  return {
    title,
    description,
    alternates: { canonical: "/search" },
    // Search result pages shouldn't be indexed individually.
    robots: query ? { index: false, follow: true } : undefined,
    openGraph: { title: `${title} · RecipeNest`, description, url: "/search" },
    twitter: { title: `${title} · RecipeNest`, description },
  };
}

export default async function SearchPage() {
  const recipes = (await listRecipes()).map(toListRecipe);
  return (
    <Suspense
      fallback={
        <div className="container-page py-16">
          <RecipeGridSkeleton count={8} />
        </div>
      }
    >
      <SearchView recipes={recipes} />
    </Suspense>
  );
}

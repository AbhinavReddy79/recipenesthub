import type { Metadata } from "next";
import { Globe2 } from "lucide-react";
import { CuisineCard } from "@/components/recipes/cuisine-card";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import { listCuisines } from "@/lib/services/catalog";
import { countRecipesByCuisine } from "@/lib/services/recipes";

export const metadata: Metadata = {
  title: "Cuisines",
  description: "Explore recipes from Indian, Italian, Mexican, Chinese, Japanese, Mediterranean, American and more.",
  alternates: { canonical: "/cuisines" },
  openGraph: { title: "Cuisines · RecipeNest", url: "/cuisines" },
};

export default async function CuisinesPage() {
  const [cuisines, counts] = await Promise.all([listCuisines(), countRecipesByCuisine()]);

  return (
    <ModuleTone tone="amber">
      <PageHeader
        icon={<Globe2 />}
        eyebrow="Around the world"
        title="Browse cuisines"
        description="Travel the world from your kitchen — every cuisine, curated by cooks who know it best."
      />
      <div className="container-page py-12 pb-24">
        <ul data-reveal suppressHydrationWarning data-reveal-grid className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cuisines.map((cuisine) => (
            <li key={cuisine.slug}>
              <CuisineCard cuisine={cuisine} count={counts[cuisine.slug] ?? 0} showDescription />
            </li>
          ))}
        </ul>
      </div>
    </ModuleTone>
  );
}

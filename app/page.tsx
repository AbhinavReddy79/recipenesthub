import { CategoryGrid } from "@/components/home/category-grid";
import { CommunityRecipes } from "@/components/community/community-recipes";
import { CompactRecipeList } from "@/components/home/compact-recipe-list";
import { FloatingBanners } from "@/components/home/floating-banners";
import { Hero } from "@/components/home/hero";
import { IngredientTeaser } from "@/components/home/ingredient-teaser";
import { KitchenSpotlight } from "@/components/home/kitchen-spotlight";
import { MealPlanCta } from "@/components/home/meal-plan-cta";
import { PickedForYou } from "@/components/home/picked-for-you";
import { WelcomeBar } from "@/components/home/welcome-bar";
import { CuisineCard } from "@/components/recipes/cuisine-card";
import { RecipeGrid } from "@/components/recipes/recipe-grid";
import { SectionHeading } from "@/components/shared/section-heading";
import { exampleWeek } from "@/data/mealPlans";
import { listCategories, listFeaturedCuisines } from "@/lib/services/catalog";
import {
  countRecipesByCuisine,
  getFeaturedRecipes,
  getQuickRecipes,
  getRecentRecipes,
  getRecipeBySlug,
  getSeasonalRecipes,
  listRecipes,
} from "@/lib/services/recipes";
import type { Recipe } from "@/types/recipe";

// "Seasonal ideas" follow the calendar, so refresh the page daily.
export const revalidate = 86400;

export default async function HomePage() {
  const [all, categories, cuisines, cuisineCounts, featuredList, quick, seasonal, recent, heroRecipe] = await Promise.all([
    listRecipes(),
    listCategories(),
    listFeaturedCuisines(),
    countRecipesByCuisine(),
    getFeaturedRecipes(8),
    getQuickRecipes(6),
    getSeasonalRecipes(),
    getRecentRecipes(4),
    getRecipeBySlug("hyderabadi-chicken-biryani"),
  ]);

  const categoryCounts = Object.fromEntries(
    categories.map((c) => [c.slug, all.filter((r) => r.categories.includes(c.slug)).length]),
  );
  const recipesBySlug = new Map(all.map((r) => [r.slug, r]));
  const heroStats = [
    { label: "Tested recipes", value: all.length },
    { label: "Cuisines", value: new Set(all.map((r) => r.cuisine)).size },
    { label: "Meal categories", value: categories.length },
  ];

  return (
    <>
      <WelcomeBar />
      <Hero featured={(heroRecipe ?? featuredList[0]) as Recipe} stats={heroStats} />

      <div className="grid grid-cols-1 gap-20 py-14 sm:gap-24 sm:py-20">
        <section aria-labelledby="browse-by-meal" className="container-page">
          <SectionHeading id="browse-by-meal" eyebrow="What's cooking" title="Browse by meal" />
          <CategoryGrid categories={categories} counts={categoryCounts} />
        </section>

        <FloatingBanners
          indianCount={cuisineCounts.indian ?? 0}
          indianImage={recipesBySlug.get("butter-chicken")?.image}
          quickCount={categoryCounts["quick-meals"] ?? quick.length}
          quickImage={quick[0]?.image}
        />

        <section data-reveal suppressHydrationWarning aria-labelledby="editors-picks" className="container-page">
          <SectionHeading
            id="editors-picks"
            eyebrow="Handpicked"
            title="Editor's picks"
            description="Tested in the RecipeNest kitchen and worth making this week."
            href="/recipes"
            linkLabel="All recipes"
          />
          <RecipeGrid recipes={featuredList} mobileCarousel />
        </section>

        <PickedForYou recipes={all} />

        <section data-reveal suppressHydrationWarning aria-labelledby="quick" className="container-page">
          <SectionHeading
            id="quick"
            eyebrow="Weeknight wins"
            title="Quick & easy"
            description="On the table in 30 minutes or less."
            href="/recipes?category=quick-meals&sort=quickest"
            linkLabel="More quick recipes"
          />
          <CompactRecipeList recipes={quick} />
        </section>

        <section data-reveal suppressHydrationWarning aria-labelledby="cuisines" className="container-page">
          <SectionHeading id="cuisines" eyebrow="Around the world" title="Explore by cuisine" href="/cuisines" linkLabel="All cuisines" />
          <ul
            data-reveal-grid
            className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 scrollbar-none sm:mx-0 sm:grid sm:snap-none sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-7"
          >
            {cuisines.map((cuisine) => (
              <li key={cuisine.slug} className="w-[42%] shrink-0 snap-start sm:w-auto">
                <CuisineCard cuisine={cuisine} count={cuisineCounts[cuisine.slug] ?? 0} compact />
              </li>
            ))}
          </ul>
        </section>

        {seasonal.recipes.length > 0 && (
          <section data-reveal suppressHydrationWarning aria-labelledby="seasonal" className="container-page">
            <SectionHeading id="seasonal" eyebrow="In season" title={seasonal.title} description="Seasonal ideas from the catalog." />
            <KitchenSpotlight recipes={seasonal.recipes} />
          </section>
        )}

        <div data-reveal suppressHydrationWarning>
          <IngredientTeaser />
        </div>

        <section data-reveal suppressHydrationWarning aria-labelledby="recent" className="container-page">
          <SectionHeading id="recent" eyebrow="Fresh from the kitchen" title="Recently added" href="/recipes?sort=newest" linkLabel="See all" />
          <RecipeGrid recipes={recent} mobileCarousel />
        </section>
      </div>

      <div data-reveal suppressHydrationWarning>
        <MealPlanCta plan={exampleWeek} recipes={recipesBySlug} />
      </div>

      <section data-reveal suppressHydrationWarning aria-labelledby="community" className="container-page py-16 sm:py-20">
        <SectionHeading
          id="community"
          eyebrow="Community"
          title="From the community"
          description="Recipes published by people cooking with RecipeNest."
          href="/community"
          linkLabel="Visit the community"
        />
        <CommunityRecipes limit={4} mobileCarousel />
      </section>
    </>
  );
}

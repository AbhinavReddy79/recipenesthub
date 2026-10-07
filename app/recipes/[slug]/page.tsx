import type { Metadata } from "next";
import { LocalRecipeDetail } from "@/components/recipes/detail/local-recipe-detail";
import { RecipeDetail } from "@/components/recipes/detail/recipe-detail";
import { CUISINE_LABELS } from "@/lib/labels";
import { getRecipeBySlug, getRelatedRecipes, listRecipeSlugs } from "@/lib/services/recipes";
import { siteConfig } from "@/lib/site";
import type { Recipe } from "@/types/recipe";

export async function generateStaticParams() {
  const slugs = await listRecipeSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/recipes/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) {
    // Possibly a community recipe from Supabase; it renders client-side.
    return { title: "Recipe", robots: { index: false } };
  }
  const title = `${recipe.title} Recipe`;
  const description = `${recipe.description} ${CUISINE_LABELS[recipe.cuisine]} · ${recipe.difficulty} · serves ${recipe.servings}.`;
  return {
    title,
    description,
    alternates: { canonical: `/recipes/${recipe.slug}` },
    openGraph: {
      type: "article",
      title: `${recipe.title} · RecipeNest`,
      description: recipe.description,
      url: `/recipes/${recipe.slug}`,
      images: [{ url: recipe.image, alt: recipe.title }],
      publishedTime: recipe.createdAt,
      authors: [recipe.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: `${recipe.title} · RecipeNest`,
      description: recipe.description,
      images: [recipe.image],
    },
  };
}

/** schema.org Recipe structured data for rich search results. */
function recipeJsonLd(recipe: Recipe) {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.description,
    image: [recipe.image],
    author: { "@type": "Person", name: recipe.author.name },
    datePublished: recipe.createdAt,
    prepTime: `PT${recipe.prepMinutes}M`,
    cookTime: `PT${recipe.cookMinutes}M`,
    totalTime: `PT${recipe.prepMinutes + recipe.cookMinutes}M`,
    recipeYield: `${recipe.servings} servings`,
    recipeCuisine: CUISINE_LABELS[recipe.cuisine],
    recipeCategory: recipe.mealType,
    keywords: (recipe.tags ?? []).join(", "),
    nutrition: { "@type": "NutritionInformation", calories: `${recipe.nutrition.calories} calories` },
    recipeIngredient: recipe.ingredients.map((i) =>
      [i.quantity ?? "", i.unit, i.name].filter(Boolean).join(" "),
    ),
    recipeInstructions: recipe.steps.map((s) => ({ "@type": "HowToStep", text: s.text })),
    url: `${siteConfig.url}/recipes/${recipe.slug}`,
  };
}

export default async function RecipePage({ params }: PageProps<"/recipes/[slug]">) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) return <LocalRecipeDetail slug={slug} />;

  const related = await getRelatedRecipes(recipe, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recipeJsonLd(recipe)).replace(/</g, "\\u003c") }}
      />
      <RecipeDetail recipe={recipe} related={related} />
    </>
  );
}

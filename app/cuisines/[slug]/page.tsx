import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CuisineCard } from "@/components/recipes/cuisine-card";
import { RegionExplorer } from "@/components/recipes/region-explorer";
import { Button } from "@/components/ui/button";
import { getCuisine, listCuisines } from "@/lib/services/catalog";
import { countRecipesByCuisine, getRecipesByCuisine } from "@/lib/services/recipes";

export async function generateStaticParams() {
  const cuisines = await listCuisines();
  return cuisines.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/cuisines/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cuisine = await getCuisine(slug);
  if (!cuisine) return { title: "Cuisine not found" };
  const title = `${cuisine.name} Recipes`;
  return {
    title,
    description: `${cuisine.description} Browse ${cuisine.name.toLowerCase()} recipes on RecipeNest.`,
    alternates: { canonical: `/cuisines/${cuisine.slug}` },
    openGraph: {
      title: `${title} · RecipeNest`,
      description: cuisine.description,
      url: `/cuisines/${cuisine.slug}`,
      images: [{ url: cuisine.image, alt: `${cuisine.name} food` }],
    },
    twitter: { card: "summary_large_image", title: `${title} · RecipeNest`, images: [cuisine.image] },
  };
}

export default async function CuisinePage({ params }: PageProps<"/cuisines/[slug]">) {
  const { slug } = await params;
  const cuisine = await getCuisine(slug);
  if (!cuisine) notFound();

  const [recipes, allCuisines, counts] = await Promise.all([
    getRecipesByCuisine(cuisine.slug),
    listCuisines(),
    countRecipesByCuisine(),
  ]);
  const others = allCuisines.filter((c) => c.slug !== cuisine.slug).slice(0, 3);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <Image src={cuisine.image} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/55 to-black/15" />
        <div className="container-page py-14 sm:py-20 lg:py-24">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-white/70">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href="/cuisines" className="hover:text-white">
              Cuisines
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <span aria-current="page" className="text-white">
              {cuisine.name}
            </span>
          </nav>
          <p className="text-xs font-bold tracking-[0.16em] text-saffron uppercase">{cuisine.region}</p>
          <h1 className="mt-3 text-5xl leading-[1.02] font-semibold text-shadow-lg sm:text-7xl">{cuisine.name}</h1>
          <p className="mt-5 max-w-xl text-pretty text-lg text-white/85 sm:text-xl">{cuisine.description}</p>
          <p className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-md">
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </p>
        </div>
      </section>

      <div className="container-page grid gap-20 py-14 pb-24">
        <section aria-labelledby="cuisine-recipes">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 id="cuisine-recipes" className="text-[2.375rem] leading-tight font-semibold">
              {cuisine.name} recipes
            </h2>
            <Button asChild variant="outline">
              <Link href={`/recipes?cuisine=${cuisine.slug}`}>Filter {cuisine.name.toLowerCase()} recipes</Link>
            </Button>
          </div>
          <RegionExplorer cuisine={cuisine.slug} recipes={recipes} />
        </section>

        <section aria-labelledby="more-cuisines">
          <h2 id="more-cuisines" className="mb-8 text-[2.375rem] leading-tight font-semibold">
            Keep exploring
          </h2>
          <ul data-reveal suppressHydrationWarning data-reveal-grid className="grid gap-4 sm:grid-cols-3">
            {others.map((c) => (
              <li key={c.slug}>
                <CuisineCard cuisine={c} count={counts[c.slug] ?? 0} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { ChefHat, Clock, Flame, Timer, Users } from "lucide-react";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate, formatMinutes } from "@/lib/format";
import { FALLBACK_RECIPE_IMAGE } from "@/lib/images";
import { CATEGORY_LABELS, CUISINE_LABELS } from "@/lib/labels";
import { isPlatformAuthor } from "@/lib/site";
import { totalMinutes } from "@/lib/recipes/query";
import type { Recipe } from "@/types/recipe";
import { IngredientList } from "../ingredient-list";
import { InstructionSteps } from "../instruction-steps";
import { NutritionCards } from "../nutrition-cards";
import { RecipeGrid } from "../recipe-grid";
import { CookingMode } from "./cooking-mode";
import { RecipeActions, StartCookingButton } from "./recipe-actions";
import { RatingSummaryLink, RecipeReviews } from "./recipe-reviews";
import { RecipeSessionProvider } from "./recipe-session";
import { ShopIngredients } from "./shop-ingredients";

interface RecipeDetailProps {
  recipe: Recipe;
  related: Recipe[];
  /** Shown above the hero, e.g. a draft notice. */
  notice?: React.ReactNode;
}

const chip = "rounded-full px-3 py-1 text-xs font-semibold transition-colors";

export function RecipeDetail({ recipe, related, notice }: RecipeDetailProps) {
  const { user } = useCurrentUser();
  const category = recipe.categories[0];
  const meta = [
    { label: "Prep", value: formatMinutes(recipe.prepMinutes), icon: Timer },
    { label: "Cook", value: formatMinutes(recipe.cookMinutes), icon: Flame },
    { label: "Total", value: formatMinutes(totalMinutes(recipe)), icon: Clock },
    { label: "Serves", value: String(recipe.servings), icon: Users },
    { label: "Difficulty", value: recipe.difficulty, icon: ChefHat },
  ];

  return (
    <RecipeSessionProvider recipe={recipe}>
      <article className="container-page pt-6 pb-24 print:max-w-none print:p-0" data-print-root>
        <Breadcrumb data-print-hide>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/recipes">Recipes</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/cuisines/${recipe.cuisine}`}>{CUISINE_LABELS[recipe.cuisine]}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:block" />
            <BreadcrumbItem className="hidden min-w-0 sm:inline-flex">
              <BreadcrumbPage className="truncate">{recipe.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {notice && (
          <div className="mt-6" data-print-hide>
            {notice}
          </div>
        )}

        <div className="mt-6 grid items-center gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14 print:mt-0 print:block">
          <figure className="grid gap-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-lift print:mb-4 print:aspect-[16/7] print:max-h-64 print:rounded-md">
              <Image
                src={recipe.image || FALLBACK_RECIPE_IMAGE}
                alt={recipe.title}
                fill
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-cover"
              />
            </div>
            {recipe.imageCredit && (
              <figcaption className="px-2 text-xs text-muted-foreground print:hidden">
                Photo:{" "}
                <a href={recipe.imageCredit.source} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-foreground hover:underline">
                  {recipe.imageCredit.author}
                </a>{" "}
                · {recipe.imageCredit.license} · Wikimedia Commons
              </figcaption>
            )}
          </figure>

          <div className="grid content-start gap-5">
            <div className="flex flex-wrap gap-2" data-print-hide>
              <Link href={`/cuisines/${recipe.cuisine}`} className={`${chip} bg-primary text-primary-foreground hover:bg-primary/90`}>
                {CUISINE_LABELS[recipe.cuisine]}
              </Link>
              {category && (
                <Link href={`/recipes?category=${category}`} className={`${chip} bg-secondary text-secondary-foreground hover:bg-accent`}>
                  {CATEGORY_LABELS[category]}
                </Link>
              )}
              {recipe.diets.slice(0, 3).map((diet) => (
                <span key={diet} className={`${chip} bg-herb-soft text-herb`}>
                  {diet}
                </span>
              ))}
            </div>
            <p className="hidden text-sm print:block">
              {CUISINE_LABELS[recipe.cuisine]}
              {category && ` · ${CATEGORY_LABELS[category]}`}
              {recipe.diets.length > 0 && ` · ${recipe.diets.slice(0, 3).join(", ")}`}
            </p>
            <h1 className="text-balance text-4xl leading-[1.06] font-semibold sm:text-5xl lg:text-[3.25rem]">
              {recipe.title}
            </h1>
            <p className="text-pretty text-lg leading-relaxed text-muted-foreground">{recipe.description}</p>
            <RatingSummaryLink />
            <div className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 ring-1 ring-border/70 print:bg-transparent print:p-0 print:ring-0">
              {isPlatformAuthor(recipe.authorId) ? (
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground print:hidden" aria-hidden>
                  <ChefHat className="size-5" />
                </span>
              ) : (
                <UserAvatar name={recipe.author.name} src={recipe.author.avatar} className="size-10 print:hidden" />
              )}
              <div className="grid text-sm">
                <span className="text-muted-foreground">Recipe by</span>
                {user && recipe.authorId === user.id ? (
                  <Link href="/profile" className="font-semibold hover:text-primary">
                    {recipe.author.name} <span className="font-normal text-muted-foreground">(you)</span>
                  </Link>
                ) : (
                  <span className="font-semibold">{recipe.author.name}</span>
                )}
              </div>
              <span className="ml-auto text-right text-xs text-muted-foreground">
                Published
                <br className="sm:hidden" /> {formatDate(recipe.createdAt)}
              </span>
            </div>
            <RecipeActions />
          </div>
        </div>

        <dl data-reveal suppressHydrationWarning data-reveal-grid className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-5 print:mt-4 print:grid-cols-5 print:gap-1">
          {meta.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="group flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card ring-1 ring-border/70 transition duration-300 last:col-span-2 hover:-translate-y-0.5 hover:shadow-lift sm:last:col-span-1 print:p-1"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 print:hidden" aria-hidden>
                <Icon className="size-5" />
              </span>
              <div className="grid min-w-0">
                <dt className="text-[0.6875rem] font-bold tracking-[0.12em] text-muted-foreground uppercase">{label}</dt>
                <dd className="font-display text-base leading-tight font-semibold sm:text-lg">{value}</dd>
              </div>
            </div>
          ))}
        </dl>

        <div data-reveal suppressHydrationWarning className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-14 print:mt-6 print:block">
          <aside className="grid gap-6 lg:sticky lg:top-24 print:static print:mb-6 print:block">
            <div className="rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:p-6 print:p-0">
              <IngredientList />
            </div>
            <div className="rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:p-6 print:hidden">
              <NutritionCards nutrition={recipe.nutrition} />
            </div>
          </aside>

          <section aria-labelledby="instructions-heading">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b pb-5">
              <div>
                <h2 id="instructions-heading" className="text-[2rem] font-semibold">
                  Method
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {recipe.steps.length} steps · {formatMinutes(totalMinutes(recipe))} total
                </p>
              </div>
              <div data-print-hide>
                <StartCookingButton variant="outline" />
              </div>
            </div>
            <InstructionSteps steps={recipe.steps} />
            {recipe.tags && recipe.tags.length > 0 && (
              <div className="mt-8 flex flex-wrap items-center gap-2" data-print-hide>
                <span className="mr-1 text-sm font-medium text-muted-foreground">Tags</span>
                {recipe.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="rounded-full border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-14">
              <ShopIngredients />
            </div>
          </section>
        </div>

        <div data-reveal suppressHydrationWarning className="mt-20 border-t pt-14">
          <RecipeReviews />
        </div>

        <p className="hidden print:mt-8 print:block print:text-xs">
          Printed from RecipeNest · {recipe.title} · {recipe.nutrition.calories} kcal per serving
        </p>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-20 border-t pt-14" data-print-hide>
            <h2 id="related-heading" className="mb-8 text-[2rem] font-semibold">
              You might also like
            </h2>
            <RecipeGrid recipes={related} showDescription={false} mobileCarousel />
          </section>
        )}
      </article>
      <CookingMode />
    </RecipeSessionProvider>
  );
}

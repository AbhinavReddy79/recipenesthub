import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChefHat, Clock, Flame, Sparkles } from "lucide-react";
import { RecipeSearchForm } from "@/components/recipes/recipe-search-form";
import { formatMinutes } from "@/lib/format";
import { unsplash } from "@/lib/images";
import { CUISINE_LABELS } from "@/lib/labels";
import { totalMinutes } from "@/lib/recipes/query";
import type { Recipe } from "@/types/recipe";

const EXAMPLES = ["Chicken", "Pasta", "Biryani", "Desserts", "Vegetarian"];

/** A table spread of shared dishes, shot from above — reads well behind white type. */
const BACKDROP = unsplash("1504674900247-0877df9cc836", 2400);

interface HeroProps {
  /** The dish pictured in the hero card. */
  featured: Recipe;
  /** Real catalog counts, shown under the search. */
  stats: { label: string; value: number }[];
}

/** Front page: a full-bleed food photo, a clear headline, search, and one featured recipe. */
export function Hero({ featured, stats }: HeroProps) {
  return (
    <section aria-labelledby="hero-title" className="relative isolate overflow-hidden bg-ink text-white">
      <Image
        src={BACKDROP}
        alt=""
        fill
        preload
        sizes="100vw"
        className="-z-20 animate-ken-burns object-cover"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 -z-10 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

      <div className="container-page grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.35fr_1fr] lg:gap-16 lg:py-24">
        <div className="max-w-2xl animate-rise">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium backdrop-blur-md">
            <Sparkles className="size-4 text-saffron animate-bounce-soft" aria-hidden />
            Tested in the RecipeNest kitchen
          </p>
          <h1
            id="hero-title"
            className="mt-6 text-balance text-[2.75rem] leading-[1.02] font-semibold text-shadow-lg sm:text-6xl lg:text-[4.25rem]"
          >
            Cook something <span className="text-gradient-gold text-shadow-none">you&apos;ll love.</span>
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-white/85 sm:text-xl">
            Discover recipes for everyday meals, special occasions, and everything in between — then plan your week
            and shop once.
          </p>

          <RecipeSearchForm className="mt-8 max-w-xl" size="lg" label="Search recipes from the homepage" />
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="mr-1 text-white/70">Popular:</span>
            {EXAMPLES.map((example) => (
              <Link
                key={example}
                href={`/search?q=${encodeURIComponent(example.toLowerCase())}`}
                className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 font-medium backdrop-blur-md transition-colors hover:border-white/40 hover:bg-white/20"
              >
                {example}
              </Link>
            ))}
          </div>

          <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-6">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="flex flex-col-reverse animate-rise"
                style={{ animationDelay: `${300 + i * 120}ms` }}
              >
                <dt className="text-sm text-white/70">{stat.label}</dt>
                <dd className="font-display text-3xl font-semibold tabular-nums">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hidden animate-float-slow lg:block">
          <FeaturedCard recipe={featured} />
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ recipe }: { recipe: Recipe }) {
  return (
    <article className="group relative mx-auto w-full max-w-md animate-rise rounded-[1.75rem] bg-card p-3 text-card-foreground shadow-2xl ring-1 ring-white/10 [animation-delay:150ms] lg:rotate-[1.5deg] lg:transition-transform lg:duration-500 lg:hover:rotate-0 lg:hover:scale-[1.02]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-muted">
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          sizes="420px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">
          <Flame className="size-3.5 text-saffron" aria-hidden />
          Featured recipe
        </span>
      </div>
      <div className="grid gap-3 px-2 pt-4 pb-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-ink uppercase">
          {CUISINE_LABELS[recipe.cuisine]}
        </p>
        <h2 className="text-2xl leading-tight font-semibold">
          <Link href={`/recipes/${recipe.slug}`} className="after:absolute after:inset-0 after:rounded-[1.75rem]">
            {recipe.title}
          </Link>
        </h2>
        <div className="flex items-center justify-between gap-4 border-t pt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden />
              {formatMinutes(totalMinutes(recipe))}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ChefHat className="size-4" aria-hidden />
              {recipe.difficulty}
            </span>
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-primary">
            Cook it
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </article>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flame, Sparkles } from "lucide-react";
import { RecipeSearchForm } from "@/components/recipes/recipe-search-form";
import { unsplash } from "@/lib/images";
import type { Recipe } from "@/types/recipe";
import { FeaturedCarousel } from "./featured-carousel";

const EXAMPLES = ["Chicken", "Pasta", "Biryani", "Desserts", "Vegetarian"];

/** A table spread of shared dishes, shot from above — reads well behind white type. */
const BACKDROP = unsplash("1504674900247-0877df9cc836", 2400);

interface HeroProps {
  /** The dishes the hero card rotates through, one at a time. */
  featured: Recipe[];
  /** Real catalog counts, shown under the search. */
  stats: { label: string; value: number }[];
  /** Today's recipe of the day, promoted with a button that jumps to it. */
  todaysPick?: Recipe;
}

/** Front page: a full-bleed food photo, a clear headline, search, and a rotating featured recipe. */
export function Hero({ featured, stats, todaysPick }: HeroProps) {
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

          {todaysPick && <TodaysPickLink recipe={todaysPick} />}

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
          <FeaturedCarousel recipes={featured} />
        </div>
      </div>
    </section>
  );
}

/** Gold button under the search that takes visitors to today's pick further down the page. */
function TodaysPickLink({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href="#todays-special"
      className="group mt-6 flex max-w-xl items-center gap-3 rounded-2xl bg-metallic-gold p-2 pr-4 text-[oklch(0.2_0.006_70)] shadow-lift ring-1 ring-white/30 transition-transform hover:-translate-y-0.5"
    >
      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl ring-2 ring-white/50">
        <Image src={recipe.image} alt="" fill sizes="48px" className="object-cover" />
      </span>
      <span className="grid min-w-0 flex-1">
        <span className="inline-flex items-center gap-1.5 text-[0.6875rem] font-bold tracking-[0.14em] uppercase">
          <Flame className="size-3.5" aria-hidden />
          Today&apos;s special
        </span>
        <span className="truncate font-display text-lg leading-tight font-semibold">{recipe.title}</span>
      </span>
      <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

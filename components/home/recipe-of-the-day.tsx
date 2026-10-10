import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChefHat, Clock, Sparkles, Users } from "lucide-react";
import { CardRating } from "@/components/recipes/card-rating";
import { FavoriteButton } from "@/components/recipes/favorite-button";
import { NextPickCountdown } from "./next-pick-countdown";
import { Button } from "@/components/ui/button";
import { formatMinutes } from "@/lib/format";
import { CUISINE_LABELS } from "@/lib/labels";
import { totalMinutes } from "@/lib/recipes/query";
import type { Recipe } from "@/types/recipe";

const dayLabel = (isoDate: string) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );

/** Today's featured recipe: one dish from the catalog, a new one every day, framed to stand out. */
export function RecipeOfTheDay({ recipe, date }: { recipe: Recipe; date: string }) {
  const href = `/recipes/${recipe.slug}`;
  const highlights = recipe.ingredients.slice(0, 5).map((i) => i.name);

  return (
    <section id="todays-special" aria-labelledby="todays-special-heading" className="container-page scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1.5">
          <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-gold-ink uppercase">
            <LiveDot className="bg-saffron" />
            Today&apos;s special
          </p>
          <h2 id="todays-special-heading" className="text-[2.375rem] leading-tight font-semibold">
            Recipe of the day
          </h2>
        </div>
        <NextPickCountdown className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-semibold text-accent-foreground shadow-soft" />
      </div>

      <div className="relative">
        {/* A soft gold glow that breathes behind the card. */}
        <div aria-hidden className="rotd-glow absolute -inset-1.5 -z-10 rounded-[2.4rem] bg-metallic-gold blur-xl sm:-inset-2" />
      <article className="group relative isolate grid overflow-hidden rounded-[2rem] bg-metallic-charcoal text-white shadow-lift ring-2 ring-saffron/60 lg:grid-cols-[1.15fr_1fr]">
        <div className="relative min-h-72 overflow-hidden sm:min-h-96">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-black/40" />
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-metallic-gold px-3 py-1.5 text-xs font-bold tracking-wide text-[oklch(0.2_0.006_70)] uppercase shadow-lift">
            <LiveDot className="bg-[oklch(0.2_0.006_70)]" />
            <Sparkles className="size-3.5" aria-hidden />
            Recipe of the day
          </span>
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">
            <CalendarDays className="size-3.5 text-gold-light" aria-hidden />
            Only today
          </span>
          <FavoriteButton slug={recipe.slug} title={recipe.title} className="absolute top-4 right-4" />
        </div>

        <div className="grid content-center gap-5 p-6 sm:p-10">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/70">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="size-4 text-gold-light" aria-hidden />
              {dayLabel(date)}
            </span>
            {/* Dark scope so the rating's text colours suit the charcoal card. */}
            <span className="dark text-white/70">
              <CardRating slug={recipe.slug} />
            </span>
          </p>
          <div className="grid gap-3">
            <p className="text-xs font-bold tracking-[0.16em] text-gold-light uppercase">{CUISINE_LABELS[recipe.cuisine]}</p>
            <h3 id="recipe-of-the-day" className="text-balance text-3xl leading-tight font-semibold sm:text-4xl">
              <Link href={href} className="hover:text-gold-light">
                {recipe.title}
              </Link>
            </h3>
            <p className="line-clamp-3 text-pretty text-white/80">{recipe.description}</p>
          </div>

          <ul className="flex flex-wrap gap-2 text-sm">
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">
              <Clock className="size-4 text-gold-light" aria-hidden />
              {formatMinutes(totalMinutes(recipe))}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">
              <ChefHat className="size-4 text-gold-light" aria-hidden />
              {recipe.difficulty}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">
              <Users className="size-4 text-gold-light" aria-hidden />
              Serves {recipe.servings}
            </li>
          </ul>

          {highlights.length > 0 && (
            <p className="text-sm text-white/70">
              <span className="font-semibold text-white">You&apos;ll need: </span>
              {highlights.join(", ")}
              {recipe.ingredients.length > highlights.length && ` and ${recipe.ingredients.length - highlights.length} more`}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg" className="bg-metallic-gold text-[oklch(0.2_0.006_70)] hover:opacity-95">
              <Link href={href}>
                Cook it today
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link href={`${href}#reviews`}>See reviews</Link>
            </Button>
          </div>
        </div>
      </article>
      </div>
    </section>
  );
}

/** A small pulsing "live" dot. */
function LiveDot({ className }: { className?: string }) {
  return (
    <span aria-hidden className="relative flex size-2">
      <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${className ?? ""}`} />
      <span className={`relative inline-flex size-2 rounded-full ${className ?? ""}`} />
    </span>
  );
}

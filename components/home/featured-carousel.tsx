"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChefHat, Clock, Flame } from "lucide-react";
import { formatMinutes } from "@/lib/format";
import { CUISINE_LABELS } from "@/lib/labels";
import { totalMinutes } from "@/lib/recipes/query";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";

const INTERVAL_MS = 5000;

/**
 * The hero's featured card: shows one recipe at a time and crossfades to the next
 * every few seconds. Pauses while hovered or focused, and when the tab is hidden.
 */
export function FeaturedCarousel({ recipes }: { recipes: Recipe[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Only load photos that have been (or are about to be) shown.
  const [loaded, setLoaded] = useState(() => new Set([0, 1]));
  const count = recipes.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((i) => {
        const next = (i + 1) % count;
        setLoaded((seen) => new Set(seen).add(next).add((next + 1) % count));
        return next;
      });
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

  const show = (i: number) => {
    setIndex(i);
    setLoaded((seen) => new Set(seen).add(i).add((i + 1) % count));
  };

  const recipe = recipes[index];
  if (!recipe) return null;

  return (
    <article
      aria-roledescription="carousel"
      aria-label="Featured recipes"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="group relative mx-auto w-full max-w-md animate-rise rounded-[1.75rem] bg-card p-3 text-card-foreground shadow-2xl ring-1 ring-white/10 [animation-delay:150ms] lg:rotate-[1.5deg] lg:transition-transform lg:duration-500 lg:hover:rotate-0 lg:hover:scale-[1.02]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-muted">
        {recipes.map((r, i) =>
          loaded.has(i) ? (
            <Image
              key={r.slug}
              src={r.image}
              alt={i === index ? r.title : ""}
              fill
              sizes="420px"
              preload={i === 0}
              className={cn(
                "object-cover transition-[opacity,transform] duration-1000 ease-out motion-reduce:transition-none",
                i === index ? "scale-100 opacity-100" : "scale-105 opacity-0",
              )}
            />
          ) : null,
        )}
        <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">
          <Flame className="size-3.5 text-saffron" aria-hidden />
          Featured recipe
        </span>
        {count > 1 && (
          <div className="absolute right-3 bottom-3 z-10 flex gap-1.5 rounded-full bg-black/55 px-2 py-1.5">
            {recipes.map((r, i) => (
              <button
                key={r.slug}
                type="button"
                onClick={() => show(i)}
                aria-label={`Show ${r.title}`}
                aria-current={i === index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-5 bg-saffron" : "w-1.5 bg-white/60 hover:bg-white",
                )}
              />
            ))}
          </div>
        )}
      </div>
      <div key={recipe.slug} className="grid animate-rise gap-3 px-2 pt-4 pb-2">
        <p className="text-xs font-semibold tracking-[0.14em] text-gold-ink uppercase">{CUISINE_LABELS[recipe.cuisine]}</p>
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

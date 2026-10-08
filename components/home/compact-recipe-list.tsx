import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import { formatMinutes } from "@/lib/format";
import { CUISINE_LABELS } from "@/lib/labels";
import { totalMinutes } from "@/lib/recipes/query";
import type { Recipe } from "@/types/recipe";

/** Two columns of thumbnail rows — a quicker-to-scan layout than another card grid. */
export function CompactRecipeList({ recipes }: { recipes: Recipe[] }) {
  return (
    <ul data-reveal-grid className="grid gap-4 sm:grid-cols-2">
      {recipes.map((recipe) => (
        <li key={recipe.slug}>
          <article className="group relative flex items-center gap-4 rounded-2xl bg-card p-3 shadow-card ring-1 ring-border/70 transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift">
            <span className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:w-28">
              <Image src={recipe.image} alt="" fill sizes="112px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            </span>
            <div className="grid min-w-0 flex-1 gap-1">
              <p className="text-[0.6875rem] font-bold tracking-[0.14em] text-gold-ink uppercase">
                {CUISINE_LABELS[recipe.cuisine]}
              </p>
              <h3 className="font-display text-lg leading-snug font-semibold">
                <Link href={`/recipes/${recipe.slug}`} className="line-clamp-2 transition-colors after:absolute after:inset-0 after:rounded-2xl group-hover:text-primary">
                  {recipe.title}
                </Link>
              </h3>
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground tabular-nums">
                <Clock className="size-3.5" aria-hidden />
                {formatMinutes(totalMinutes(recipe))}
              </p>
            </div>
            <ArrowUpRight
              className="mr-2 hidden size-5 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary sm:block"
              aria-hidden
            />
          </article>
        </li>
      ))}
    </ul>
  );
}

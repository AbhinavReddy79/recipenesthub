import Image from "next/image";
import Link from "next/link";
import { ChefHat, Clock } from "lucide-react";
import { FavoriteButton } from "@/components/recipes/favorite-button";
import { formatMinutes } from "@/lib/format";
import { CUISINE_LABELS } from "@/lib/labels";
import { totalMinutes } from "@/lib/recipes/query";
import type { Recipe } from "@/types/recipe";

const meta = (recipe: Recipe) =>
  `${CUISINE_LABELS[recipe.cuisine]} · ${formatMinutes(totalMinutes(recipe))} · ${recipe.difficulty}`;

/** One lead recipe with a short numbered list beside it — breaks up the grid rhythm on the homepage. */
export function KitchenSpotlight({ recipes }: { recipes: Recipe[] }) {
  const [lead, ...rest] = recipes;
  if (!lead) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
      <article className="group relative isolate flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-3xl bg-ink shadow-card sm:min-h-[30rem]">
        <Image
          src={lead.image}
          alt={lead.title}
          fill
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
        <FavoriteButton slug={lead.slug} title={lead.title} className="absolute top-4 right-4" />

        <div className="grid max-w-xl gap-3 p-6 text-white sm:p-8">
          <span className="w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {CUISINE_LABELS[lead.cuisine]}
          </span>
          <h3 className="text-balance text-3xl leading-tight font-semibold text-shadow-md sm:text-[2.25rem]">
            <Link href={`/recipes/${lead.slug}`} className="after:absolute after:inset-0">
              {lead.title}
            </Link>
          </h3>
          <p className="line-clamp-2 text-pretty text-white/85">{lead.description}</p>
          <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-medium text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden />
              {formatMinutes(totalMinutes(lead))}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ChefHat className="size-4" aria-hidden />
              {lead.difficulty}
            </span>
          </p>
        </div>
      </article>

      <ol className="grid content-start gap-3">
        {rest.map((recipe, index) => (
          <li key={recipe.slug}>
            <article className="group relative flex items-center gap-4 rounded-2xl bg-card p-3 shadow-card ring-1 ring-border/70 transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lift">
              <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
                <Image src={recipe.image} alt="" fill sizes="80px" className="object-cover" />
                <span className="absolute top-1.5 left-1.5 flex size-6 items-center justify-center rounded-full bg-primary font-display text-xs font-semibold text-primary-foreground">
                  {index + 2}
                </span>
              </span>
              <div className="grid min-w-0 gap-1">
                <h3 className="font-display text-lg leading-snug font-semibold">
                  <Link href={`/recipes/${recipe.slug}`} className="line-clamp-2 transition-colors after:absolute after:inset-0 after:rounded-2xl group-hover:text-primary">
                    {recipe.title}
                  </Link>
                </h3>
                <p className="text-sm text-muted-foreground">{meta(recipe)}</p>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}

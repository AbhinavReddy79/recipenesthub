import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { formatMinutes } from "@/lib/format";
import { FALLBACK_RECIPE_IMAGE } from "@/lib/images";
import { CUISINE_LABELS } from "@/lib/labels";
import { totalMinutes } from "@/lib/recipes/query";
import { isPlatformAuthor } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { Difficulty, Recipe } from "@/types/recipe";
import { CardRating } from "./card-rating";
import { FavoriteButton } from "./favorite-button";

interface RecipeCardProps {
  recipe: Recipe;
  priority?: boolean;
  showDescription?: boolean;
  showFavorite?: boolean;
  /** Small label over the image, e.g. a match percentage. */
  badge?: ReactNode;
  /** Extra controls rendered under the card body (e.g. edit/delete). */
  actions?: ReactNode;
  sizes?: string;
  className?: string;
}

const DIFFICULTY_DOT: Record<Difficulty, string> = {
  Easy: "bg-herb",
  Medium: "bg-saffron",
  Hard: "bg-terracotta",
};

/** Photo first, then the cuisine, title and the details people scan for. */
export function RecipeCard({
  recipe,
  priority = false,
  showDescription = false,
  showFavorite = true,
  badge,
  actions,
  sizes = "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
  className,
}: RecipeCardProps) {
  const href = `/recipes/${recipe.slug}`;
  return (
    <article
      className={cn(
        "@container group relative flex flex-col overflow-hidden rounded-[1.375rem] bg-card shadow-card ring-1 ring-border/50 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lift active:scale-[0.985]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <Image
          src={recipe.image || FALLBACK_RECIPE_IMAGE}
          alt={recipe.title}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {badge && <div className="absolute top-3 left-3 z-10">{badge}</div>}
        {showFavorite && (
          <FavoriteButton slug={recipe.slug} title={recipe.title} className="absolute top-2 right-2 @3xs:top-3 @3xs:right-3" />
        )}
        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[0.6875rem] font-semibold text-white backdrop-blur-md @3xs:bottom-3 @3xs:left-3 @3xs:gap-1.5 @3xs:px-2.5 @3xs:py-1 @3xs:text-xs">
          <Clock className="size-3 @3xs:size-3.5" aria-hidden />
          <span className="sr-only">Total time </span>
          {formatMinutes(totalMinutes(recipe))}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3 @3xs:p-4 @xs:p-5">
        <p className="truncate text-[0.625rem] font-bold tracking-[0.12em] text-gold-ink uppercase @3xs:text-[0.6875rem] @3xs:tracking-[0.14em]">
          {CUISINE_LABELS[recipe.cuisine]}
        </p>
        <h3 className="mt-1 font-display text-[0.9375rem] leading-snug font-semibold @3xs:mt-1.5 @3xs:text-[1.1875rem]">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:rounded-[1.375rem] after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background"
          >
            <span className="line-clamp-2 transition-colors group-hover:text-primary">{recipe.title}</span>
          </Link>
        </h3>
        {showDescription && (
          <p className="mt-1.5 line-clamp-2 hidden text-sm leading-relaxed text-muted-foreground @3xs:block">{recipe.description}</p>
        )}

        <div className="mt-auto pt-3 @3xs:pt-4">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-dashed pt-2.5 text-xs text-muted-foreground @3xs:gap-x-4 @3xs:pt-3 @3xs:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", DIFFICULTY_DOT[recipe.difficulty])} aria-hidden />
              {recipe.difficulty}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" aria-hidden />
              <span className="sr-only @3xs:not-sr-only">Serves </span>
              {recipe.servings}
            </span>
            <CardRating slug={recipe.slug} />
          </p>

          {!isPlatformAuthor(recipe.authorId) && (
            <p className="mt-1.5 truncate text-xs text-muted-foreground @3xs:text-sm">
              By <span className="font-medium text-foreground">{recipe.author.name}</span>
            </p>
          )}

          {actions && <div className="relative z-10 mt-3 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </article>
  );
}

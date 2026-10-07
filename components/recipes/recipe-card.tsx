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
        "group relative flex flex-col overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border/70 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lift",
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
          <FavoriteButton slug={recipe.slug} title={recipe.title} className="absolute top-3 right-3" />
        )}
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
          <Clock className="size-3.5" aria-hidden />
          <span className="sr-only">Total time </span>
          {formatMinutes(totalMinutes(recipe))}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="text-[0.6875rem] font-bold tracking-[0.14em] text-primary uppercase">
          {CUISINE_LABELS[recipe.cuisine]}
        </p>
        <h3 className="mt-1.5 font-display text-[1.1875rem] leading-snug font-semibold">
          <Link
            href={href}
            className="outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-offset-2 focus-visible:after:ring-offset-background"
          >
            <span className="line-clamp-2 transition-colors group-hover:text-primary">{recipe.title}</span>
          </Link>
        </h3>
        {showDescription && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{recipe.description}</p>
        )}

        <div className="mt-auto pt-4">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-dashed pt-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", DIFFICULTY_DOT[recipe.difficulty])} aria-hidden />
              {recipe.difficulty}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" aria-hidden />
              Serves {recipe.servings}
            </span>
            <CardRating slug={recipe.slug} />
          </p>

          {!isPlatformAuthor(recipe.authorId) && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              By <span className="font-medium text-foreground">{recipe.author.name}</span>
            </p>
          )}

          {actions && <div className="relative z-10 mt-3 flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
    </article>
  );
}

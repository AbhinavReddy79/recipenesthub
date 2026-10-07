import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Recipe } from "@/types/recipe";
import { RecipeCard } from "./recipe-card";

interface RecipeGridProps {
  recipes: Recipe[];
  columns?: 3 | 4;
  priorityCount?: number;
  showDescription?: boolean;
  renderBadge?: (recipe: Recipe) => ReactNode;
  renderActions?: (recipe: Recipe) => ReactNode;
  /** On phones, show the cards as a horizontal swipe row instead of a tall stack. */
  mobileCarousel?: boolean;
  className?: string;
}

export function RecipeGrid({
  recipes,
  columns = 4,
  priorityCount = 0,
  showDescription = false,
  renderBadge,
  renderActions,
  mobileCarousel = false,
  className,
}: RecipeGridProps) {
  return (
    <ul
      data-reveal suppressHydrationWarning
      data-reveal-grid
      className={cn(
        mobileCarousel
          ? "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pt-1 pb-5 scrollbar-none sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pt-0 sm:pb-0"
          : "grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6",
        columns === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3",
        className,
      )}
    >
      {recipes.map((recipe, index) => (
        <li key={recipe.id} className={cn("flex", mobileCarousel && "w-[80%] max-w-80 shrink-0 snap-start sm:w-auto sm:max-w-none")}>
          <RecipeCard
            className="w-full"
            recipe={recipe}
            priority={index < priorityCount}
            showDescription={showDescription}
            badge={renderBadge?.(recipe)}
            actions={renderActions?.(recipe)}
            sizes={
              columns === 4
                ? "(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
                : "(min-width: 1024px) 28vw, (min-width: 640px) 46vw, 92vw"
            }
          />
        </li>
      ))}
    </ul>
  );
}

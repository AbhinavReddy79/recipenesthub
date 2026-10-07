"use client";

import { ChefHat, Printer, Share2 } from "lucide-react";
import { AddToCollection } from "@/components/collections/add-to-collection";
import { ShareButton } from "@/components/shared/share-dialog";
import { AddToPlanDialog } from "@/components/planner/add-to-plan-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FavoriteButton } from "../favorite-button";
import { useRecipeSession } from "./recipe-session";

export function StartCookingButton({ className, variant = "default" }: { className?: string; variant?: "default" | "outline" }) {
  const { setCooking } = useRecipeSession();
  return (
    <Button size="lg" variant={variant} onClick={() => setCooking(true)} className={className}>
      <ChefHat data-icon="inline-start" />
      Start cooking
    </Button>
  );
}

export function RecipeActions() {
  const { recipe, servings } = useRecipeSession();

  return (
    <div className="flex flex-wrap items-center gap-2" data-print-hide>
      <StartCookingButton />
      <FavoriteButton slug={recipe.slug} title={recipe.title} variant="button" className="h-11 px-4" />
      <div className="flex flex-wrap gap-2">
        <AddToCollection slug={recipe.slug} title={recipe.title} />
        <AddToPlanDialog recipe={recipe} servings={servings} />
        <ShareButton title={recipe.title} text={recipe.description} url={`/recipes/${recipe.slug}`}>
          {(openShare) => (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={openShare} aria-label="Share recipe">
                  <Share2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>
          )}
        </ShareButton>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" onClick={() => window.print()} aria-label="Print recipe">
              <Printer />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Print</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { RecipeGrid } from "@/components/recipes/recipe-grid";
import { RecipeGridSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { useUserRecipes } from "@/hooks/use-user-recipes";

interface CommunityRecipesProps {
  /** Max recipes to show (e.g. on the homepage); shows all when omitted. */
  limit?: number;
  /** Swipe row on phones (homepage). */
  mobileCarousel?: boolean;
}

/**
 * Recipes published by real RecipeNest users — nothing is seeded. Before anyone
 * has shared a recipe, this invites visitors to be among the first creators.
 */
export function CommunityRecipes({ limit, mobileCarousel = false }: CommunityRecipesProps) {
  const hydrated = useHydrated();
  const { published } = useUserRecipes();

  if (!hydrated) return <RecipeGridSkeleton count={limit ?? 4} />;

  if (published.length === 0) {
    return (
      <div className="relative isolate grid justify-items-center gap-4 overflow-hidden rounded-3xl bg-warm-glow px-6 py-14 text-center ring-1 ring-border/70 sm:py-16">
        <div aria-hidden className="absolute inset-0 -z-10 bg-dots opacity-70 [mask-image:radial-gradient(closest-side,black,transparent)]" />
        <span className="flex size-16 items-center justify-center rounded-2xl bg-tone-soft text-tone animate-float">
          <Users className="size-7" strokeWidth={1.75} aria-hidden />
        </span>
        <h3 className="max-w-lg text-balance text-2xl font-semibold sm:text-[1.75rem]">
          RecipeNest community is just getting started.
        </h3>
        <p className="max-w-md text-pretty text-muted-foreground">
          Be one of the first cooks to share a recipe. Published recipes appear here and in Search, credited to you.
        </p>
        <Button asChild size="lg" className="mt-2">
          <Link href="/recipes/create">
            <Plus data-icon="inline-start" />
            Create a recipe
          </Link>
        </Button>
      </div>
    );
  }

  const newest = [...published].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return <RecipeGrid recipes={limit ? newest.slice(0, limit) : newest} priorityCount={4} mobileCarousel={mobileCarousel} />;
}

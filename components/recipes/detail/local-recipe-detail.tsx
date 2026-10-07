"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PencilLine, Trash2 } from "lucide-react";
import { RecipeDetailSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUserRecipes } from "@/hooks/use-user-recipes";
import { DeleteRecipeDialog } from "../delete-recipe-dialog";
import { RecipeDetail } from "./recipe-detail";
import { RecipeNotFound } from "./recipe-not-found";

/**
 * Renders recipes created by people on this device. Published recipes are
 * public; drafts are only visible to their author. With a backend these would
 * be served like any other recipe.
 */
export function LocalRecipeDetail({ slug }: { slug: string }) {
  const hydrated = useHydrated();
  const { all } = useUserRecipes();
  const { user } = useCurrentUser();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  if (!hydrated) return <RecipeDetailSkeleton />;

  const recipe = all.find((r) => r.slug === slug && (r.status === "published" || r.authorId === user?.id));
  if (!recipe) return <RecipeNotFound />;
  const isAuthor = recipe.authorId === user?.id;

  const notice = isAuthor ? (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-accent px-4 py-3 text-sm text-accent-foreground">
      <p>
        {recipe.status === "draft" ? (
          <>
            <strong>Draft preview.</strong> Only you can see this recipe until it&apos;s published.
          </>
        ) : (
          <>
            <strong>Your recipe is live.</strong> It appears in Discover, Search and Community.
          </>
        )}
      </p>
      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/my-recipes/${recipe.id}/edit`}>
            <PencilLine />
            Edit recipe
          </Link>
        </Button>
        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirming(true)}>
          <Trash2 />
          Delete
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <>
      <RecipeDetail recipe={recipe} related={[]} notice={notice} />
      <DeleteRecipeDialog
        recipe={confirming ? recipe : null}
        onOpenChange={(open) => !open && setConfirming(false)}
        onDeleted={() => router.push("/my-recipes")}
      />
    </>
  );
}

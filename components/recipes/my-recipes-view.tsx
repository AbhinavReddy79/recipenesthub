"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Eye, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { RecipeGridSkeleton } from "@/components/shared/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHydrated } from "@/hooks/use-hydrated";
import { useUserRecipes } from "@/hooks/use-user-recipes";
import type { Recipe } from "@/types/recipe";
import { DeleteRecipeDialog } from "./delete-recipe-dialog";
import { RecipeGrid } from "./recipe-grid";

export function MyRecipesView() {
  const hydrated = useHydrated();
  const { myPublished: published, myDrafts: drafts } = useUserRecipes();
  const [deleting, setDeleting] = useState<Recipe | null>(null);

  if (!hydrated) return <RecipeGridSkeleton count={3} columns={3} />;

  const actions = (recipe: Recipe) => (
    <>
      <Button asChild size="sm" variant="outline">
        <Link href={`/recipes/${recipe.slug}`}>
          <Eye />
          View
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline">
        <Link href={`/my-recipes/${recipe.id}/edit`}>
          <Pencil />
          Edit
        </Link>
      </Button>
      <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleting(recipe)}>
        <Trash2 />
        Delete
      </Button>
    </>
  );

  const empty = (kind: "published" | "drafts") => (
    <EmptyState
      icon={kind === "published" ? BookOpen : FileText}
      title={kind === "published" ? "Share your first recipe." : "No drafts in progress"}
      description={
        kind === "published"
          ? "Your published recipes will appear here — and across Discover and Search."
          : "Save a recipe as a draft to finish it later."
      }
      actions={
        <Button asChild size="lg">
          <Link href="/recipes/create">
            <Plus data-icon="inline-start" />
            Create Recipe
          </Link>
        </Button>
      }
    />
  );

  return (
    <>
      <Tabs defaultValue="published" className="gap-8">
        <TabsList variant="line" className="gap-4">
          <TabsTrigger value="published">
            Published <Badge className="bg-herb-soft text-herb">{published.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="drafts">
            Drafts <Badge className="bg-amber-soft text-amber">{drafts.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="published">
          {published.length ? <RecipeGrid recipes={published} columns={3} renderActions={actions} /> : empty("published")}
        </TabsContent>
        <TabsContent value="drafts">
          {drafts.length ? (
            <RecipeGrid
              recipes={drafts}
              columns={3}
              renderActions={actions}
              renderBadge={() => (
                <Badge data-tone="amber" className="bg-tone text-tone-foreground shadow-soft">
                  Draft
                </Badge>
              )}
            />
          ) : (
            empty("drafts")
          )}
        </TabsContent>
      </Tabs>

      <DeleteRecipeDialog recipe={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </>
  );
}

"use client";

import Link from "next/link";
import { PenLine, SearchX } from "lucide-react";
import { RequireProfile } from "@/components/auth/require-profile";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUserRecipes } from "@/hooks/use-user-recipes";
import { RecipeForm } from "./recipe-form";

/** Create or edit a recipe. Only the signed-in author can edit their own recipes. */
export function RecipeFormPage({ editId }: { editId?: string }) {
  return (
    <RequireProfile
      icon={<PenLine />}
      title={editId ? "Log in to edit your recipe" : "Create a profile to share recipes"}
      description="Recipes you publish are credited to your profile and appear in Recipes, Search and Community."
    >
      <FormForUser editId={editId} />
    </RequireProfile>
  );
}

function FormForUser({ editId }: { editId?: string }) {
  const { user } = useCurrentUser();
  const { mine } = useUserRecipes();
  if (!user) return null;

  if (editId) {
    const existing = mine.find((r) => r.id === editId);
    if (!existing) {
      return (
        <EmptyState
          icon={SearchX}
          title="We couldn't find that recipe"
          description="You can only edit recipes you've created with your profile."
          actions={
            <Button asChild size="lg">
              <Link href="/my-recipes">Back to My Recipes</Link>
            </Button>
          }
        />
      );
    }
    return <RecipeForm key={existing.id} existing={existing} profile={user} />;
  }
  return <RecipeForm profile={user} />;
}

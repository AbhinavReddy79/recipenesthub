import type { Metadata } from "next";
import Link from "next/link";
import { BookHeart, FolderHeart, Heart } from "lucide-react";
import { RequireProfile } from "@/components/auth/require-profile";
import { SavedView } from "@/components/recipes/saved-view";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { listRecipes } from "@/lib/services/recipes";
import { toCardRecipe } from "@/lib/recipes/slim";

export const metadata: Metadata = {
  title: "Saved Recipes",
  description: "Your personal cookbook of saved recipes.",
  robots: { index: false },
};

export default async function SavedPage() {
  const recipes = (await listRecipes()).map(toCardRecipe);
  return (
    <ModuleTone tone="red">
      <PageHeader
        icon={<Heart />}
        eyebrow="Your cookbook"
        title="Saved recipes"
        description="Everything you've hearted, in one place."
        actions={
          <Button asChild variant="outline" size="lg">
            <Link href="/collections">
              <FolderHeart data-icon="inline-start" />
              Collections
            </Link>
          </Button>
        }
      />
      <div className="container-page py-12 pb-24">
        <RequireProfile
          icon={<BookHeart />}
          title="Start your cookbook"
          description="Create a free profile to save recipes you love and find them here anytime."
        >
          <SavedView recipes={recipes} />
        </RequireProfile>
      </div>
    </ModuleTone>
  );
}

import type { Metadata } from "next";
import { FolderHeart } from "lucide-react";
import { RequireProfile } from "@/components/auth/require-profile";
import { CollectionsGrid, NewCollectionButton } from "@/components/collections/collections-view";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import { listRecipes } from "@/lib/services/recipes";
import { toCardRecipe } from "@/lib/recipes/slim";

export const metadata: Metadata = {
  title: "Collections",
  description: "Organize recipes into collections for every occasion.",
  robots: { index: false },
};

export default async function CollectionsPage() {
  const recipes = (await listRecipes()).map(toCardRecipe);
  return (
    <ModuleTone tone="berry">
      <PageHeader
        icon={<FolderHeart />}
        eyebrow="Your kitchen"
        title="Collections"
        description="Curate recipes for weeknights, celebrations and everything in between."
        actions={<NewCollectionButton />}
      />
      <div className="container-page py-12 pb-24">
        <RequireProfile
          icon={<FolderHeart />}
          title="Organise recipes your way"
          description="Create a free profile to group recipes into collections for weeknights, celebrations and meal prep."
        >
          <CollectionsGrid recipes={recipes} />
        </RequireProfile>
      </div>
    </ModuleTone>
  );
}

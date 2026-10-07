import type { Metadata } from "next";
import { FolderHeart } from "lucide-react";
import { RequireProfile } from "@/components/auth/require-profile";
import { CollectionDetailView } from "@/components/collections/collection-detail-view";
import { listRecipes } from "@/lib/services/recipes";

export const metadata: Metadata = { title: "Collection", robots: { index: false } };

export default async function CollectionPage({ params }: PageProps<"/collections/[id]">) {
  const { id } = await params;
  const recipes = await listRecipes();
  return (
    <RequireProfile
      icon={<FolderHeart />}
      title="Log in to see your collections"
      description="Collections belong to your profile. Log in or create a free profile to view this collection."
      gateClassName="container-page py-16"
    >
      <CollectionDetailView id={id} recipes={recipes} />
    </RequireProfile>
  );
}

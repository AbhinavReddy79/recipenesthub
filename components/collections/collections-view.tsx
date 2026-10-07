"use client";

import { useState } from "react";
import { FolderPlus, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/hooks/use-catalog";
import { useCollections } from "@/hooks/use-collections";
import { useHydrated } from "@/hooks/use-hydrated";
import { useRequireUser } from "@/hooks/use-require-user";
import type { Collection } from "@/types/collection";
import type { Recipe } from "@/types/recipe";
import { CollectionCard } from "./collection-card";
import { CollectionFormDialog } from "./collection-form-dialog";
import { DeleteCollectionDialog } from "./delete-collection-dialog";

export function useCollectionImages(serverRecipes: Recipe[]) {
  const { bySlug } = useCatalog(serverRecipes);
  return (collection: Collection) =>
    collection.recipeSlugs
      .map((slug) => bySlug.get(slug)?.image)
      .filter((src): src is string => Boolean(src))
      .slice(0, 3);
}

export function CollectionsGrid({ recipes, showCreate = true }: { recipes: Recipe[]; showCreate?: boolean }) {
  const hydrated = useHydrated();
  const { collections } = useCollections();
  const imagesFor = useCollectionImages(recipes);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState<Collection | null>(null);

  if (!hydrated) {
    return (
      <div role="status" aria-label="Loading collections" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      {collections.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="Create your first collection."
          description="Group recipes for weeknights, holidays, meal prep — however you like to cook."
          actions={
            <Button size="lg" onClick={() => setCreating(true)}>
              <Plus data-icon="inline-start" />
              New Collection
            </Button>
          }
        />
      ) : (
        <ul data-reveal suppressHydrationWarning data-reveal-grid className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection) => (
            <li key={collection.id} className="flex">
              <div className="w-full">
                <CollectionCard
                  collection={collection}
                  images={imagesFor(collection)}
                  onEdit={() => setEditing(collection)}
                  onDelete={() => setDeleting(collection)}
                />
              </div>
            </li>
          ))}
          {showCreate && (
            <li>
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="group/new flex h-full min-h-64 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-tone/25 text-muted-foreground transition-all duration-300 hover:-translate-y-1 hover:border-tone/60 hover:bg-tone-soft hover:text-tone"
              >
                <span className="flex size-14 items-center justify-center rounded-2xl bg-tone text-tone-foreground shadow-lift transition-transform duration-300 group-hover/new:scale-110 group-hover/new:rotate-90">
                  <Plus className="size-6" aria-hidden />
                </span>
                <span className="font-medium">New collection</span>
              </button>
            </li>
          )}
        </ul>
      )}

      <CollectionFormDialog open={creating} onOpenChange={setCreating} />
      <CollectionFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        collection={editing ?? undefined}
      />
      <DeleteCollectionDialog collection={deleting} onOpenChange={(open) => !open && setDeleting(null)} />
    </>
  );
}

export function NewCollectionButton() {
  const [open, setOpen] = useState(false);
  const requireUser = useRequireUser();
  return (
    <>
      <Button size="lg" onClick={() => requireUser("Create a free profile to start building collections.") && setOpen(true)}>
        <Plus data-icon="inline-start" />
        Create collection
      </Button>
      <CollectionFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

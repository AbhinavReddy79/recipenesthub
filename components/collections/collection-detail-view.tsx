"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FolderOpen, Pencil, Plus, SearchX, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { RecipeGrid } from "@/components/recipes/recipe-grid";
import { RecipePickerDialog } from "@/components/recipes/recipe-picker-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { RecipeGridSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalog } from "@/hooks/use-catalog";
import { collectionActions, useCollection } from "@/hooks/use-collections";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDate, pluralize } from "@/lib/format";
import type { Recipe } from "@/types/recipe";
import { CollectionCover } from "./collection-cover";
import { CollectionFormDialog } from "./collection-form-dialog";
import { DeleteCollectionDialog } from "./delete-collection-dialog";

export function CollectionDetailView({ id, recipes: serverRecipes }: { id: string; recipes: Recipe[] }) {
  const hydrated = useHydrated();
  const collection = useCollection(id);
  const { recipes, bySlug } = useCatalog(serverRecipes);
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const items = useMemo(
    () => (collection?.recipeSlugs ?? []).map((s) => bySlug.get(s)).filter((r): r is Recipe => Boolean(r)),
    [collection, bySlug],
  );

  if (!hydrated) {
    return (
      <div className="container-page py-10">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <div className="mt-10">
          <RecipeGridSkeleton count={4} />
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container-page py-16">
        <EmptyState
          headingLevel="h1"
          icon={SearchX}
          title="Collection not found"
          description="It may have been deleted. Your other collections are still here."
          actions={
            <Button asChild size="lg">
              <Link href="/collections">Back to collections</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      <section data-tone="berry" className="relative isolate overflow-hidden border-b bg-warm-glow">
        <div aria-hidden className="absolute inset-y-0 right-0 -z-10 w-1/2 bg-dots [mask-image:linear-gradient(to_left,black,transparent)]" />
        <div className="container-page grid gap-8 py-10 md:grid-cols-[minmax(0,420px)_1fr] md:items-end">
          <div className="group animate-in fade-in zoom-in-95 duration-500 md:-rotate-1">
            <CollectionCover
              images={items.map((r) => r.image).slice(0, 3)}
              className="aspect-[16/10] overflow-hidden rounded-3xl shadow-lift ring-8 ring-card/70"
              sizes="(min-width: 768px) 30vw, 90vw"
            />
          </div>
          <div className="grid gap-4">
            <Link href="/collections" className="group/back inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-tone hover:underline">
              <ArrowLeft className="size-4 transition-transform group-hover/back:-translate-x-0.5" aria-hidden />
              All collections
            </Link>
            <h1 className="text-4xl font-semibold sm:text-5xl">{collection.name}</h1>
            {collection.description && <p className="max-w-xl text-lg text-muted-foreground">{collection.description}</p>}
            <p className="text-sm text-muted-foreground">
              {pluralize(items.length, "recipe")} · Updated {formatDate(collection.updatedAt)}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={() => setPicking(true)}>
                <Plus data-icon="inline-start" />
                Add Recipe
              </Button>
              <Button size="lg" variant="outline" onClick={() => setEditing(true)}>
                <Pencil data-icon="inline-start" />
                Edit Collection
              </Button>
              <Button size="lg" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleting(true)}>
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container-page py-12 pb-24">
        {items.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="This collection is empty"
            description="Add a few recipes to get it started."
            actions={
              <Button size="lg" onClick={() => setPicking(true)}>
                <Plus data-icon="inline-start" />
                Add Recipe
              </Button>
            }
          />
        ) : (
          <RecipeGrid
            recipes={items}
            priorityCount={4}
            renderActions={(recipe) => (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  collectionActions.removeRecipe(collection.id, recipe.slug);
                  toast(`Removed ${recipe.title}`, {
                    action: { label: "Undo", onClick: () => collectionActions.addRecipe(collection.id, recipe.slug) },
                  });
                }}
              >
                <X />
                Remove
              </Button>
            )}
          />
        )}
      </div>

      <RecipePickerDialog
        open={picking}
        onOpenChange={setPicking}
        recipes={recipes}
        title={`Add to ${collection.name}`}
        description="Search the catalog or pick from your saved recipes."
        isSelected={(r) => collection.recipeSlugs.includes(r.slug)}
        onPick={(r) => collectionActions.toggleRecipe(collection.id, r.slug)}
      />
      <CollectionFormDialog open={editing} onOpenChange={setEditing} collection={collection} />
      <DeleteCollectionDialog
        collection={deleting ? collection : null}
        onOpenChange={(open) => !open && setDeleting(false)}
        onDeleted={() => router.push("/collections")}
      />
    </>
  );
}

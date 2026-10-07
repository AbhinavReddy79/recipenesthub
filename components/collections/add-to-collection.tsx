"use client";

import { useState } from "react";
import { Check, FolderPlus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCollections } from "@/hooks/use-collections";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useRequireUser } from "@/hooks/use-require-user";
import { CollectionFormDialog } from "./collection-form-dialog";

export function AddToCollection({ slug, title }: { slug: string; title: string }) {
  const { collections, toggleRecipe } = useCollections();
  const hydrated = useHydrated();
  const { user } = useCurrentUser();
  const requireUser = useRequireUser();
  const [creating, setCreating] = useState(false);
  const inCount = hydrated ? collections.filter((c) => c.recipeSlugs.includes(slug)).length : 0;

  if (!hydrated || !user) {
    return (
      <Button variant="outline" onClick={() => requireUser("Create a free profile to organise recipes into collections.")}>
        <FolderPlus />
        Add to collection
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            <FolderPlus />
            {inCount > 0 ? `In ${inCount} ${inCount === 1 ? "collection" : "collections"}` : "Add to collection"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Save “{title}” to…</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="max-h-64 overflow-y-auto">
            {collections.length === 0 && (
              <p className="px-2 py-3 text-sm text-muted-foreground">You don&apos;t have any collections yet.</p>
            )}
            {collections.map((collection) => {
              const included = collection.recipeSlugs.includes(slug);
              return (
                <DropdownMenuItem
                  key={collection.id}
                  onSelect={(event) => {
                    event.preventDefault();
                    toggleRecipe(collection.id, slug);
                    toast.success(included ? `Removed from ${collection.name}` : `Added to ${collection.name}`);
                  }}
                  className="justify-between"
                >
                  <span className="truncate">{collection.name}</span>
                  {included && <Check className="text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreating(true)}>
            <Plus />
            New collection
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CollectionFormDialog open={creating} onOpenChange={setCreating} initialRecipeSlug={slug} />
    </>
  );
}

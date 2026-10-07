"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { collectionActions } from "@/hooks/use-collections";
import { validateRequired } from "@/lib/validation";
import type { Collection } from "@/types/collection";

interface CollectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit this collection; omit to create a new one. */
  collection?: Collection;
  /** Recipe to add to a newly created collection. */
  initialRecipeSlug?: string;
  onSaved?: (collection: Collection) => void;
}

export function CollectionFormDialog(props: CollectionFormDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="p-6 sm:max-w-md">
        {/* Remount the form each time the dialog opens so fields start fresh. */}
        {props.open && <CollectionForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function CollectionForm({ onOpenChange, collection, initialRecipeSlug, onSaved }: CollectionFormDialogProps) {
  const [name, setName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const [error, setError] = useState<string>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const problem = validateRequired(name, "Collection name", 2) ?? (name.trim().length > 40 ? "Keep it under 40 characters." : undefined);
    setError(problem);
    if (problem) return;

    if (collection) {
      collectionActions.update(collection.id, { name, description });
      toast.success("Collection updated");
      onSaved?.({ ...collection, name, description });
    } else {
      const created = collectionActions.create({
        name,
        description,
        recipeSlugs: initialRecipeSlug ? [initialRecipeSlug] : [],
      });
      toast.success(`Created “${created.name}”`);
      onSaved?.(created);
    }
    onOpenChange(false);
  };

  const title: ReactNode = collection ? "Edit collection" : "New collection";

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
        <DialogDescription>
          {collection ? "Update the name and description." : "Group recipes for an occasion, a mood, or a week."}
        </DialogDescription>
      </DialogHeader>
      <FormField id="collection-name" label="Name" required error={error}>
        {(control) => (
          <Input
            {...control}
            autoFocus
            maxLength={60}
            placeholder="e.g. Cozy Sunday Dinners"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
      </FormField>
      <FormField id="collection-description" label="Description" hint="Optional">
        {(control) => (
          <Textarea
            {...control}
            rows={3}
            maxLength={160}
            placeholder="What ties these recipes together?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}
      </FormField>
      <DialogFooter className="-mx-6 -mb-6 px-6">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit">{collection ? "Save changes" : "Create collection"}</Button>
      </DialogFooter>
    </form>
  );
}

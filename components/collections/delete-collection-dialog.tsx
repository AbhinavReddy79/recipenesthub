"use client";

import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { collectionActions } from "@/hooks/use-collections";
import type { Collection } from "@/types/collection";

interface DeleteCollectionDialogProps {
  collection: Collection | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function DeleteCollectionDialog({ collection, onOpenChange, onDeleted }: DeleteCollectionDialogProps) {
  return (
    <AlertDialog open={collection !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{collection?.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            The collection will be removed. The recipes themselves stay in RecipeNest and in your saved list.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              if (!collection) return;
              collectionActions.remove(collection.id);
              toast(`Deleted “${collection.name}”`);
              onDeleted?.();
            }}
          >
            Delete collection
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

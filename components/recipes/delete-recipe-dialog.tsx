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
import { recipesStorage } from "@/lib/storage/recipes";
import type { Recipe } from "@/types/recipe";

interface DeleteRecipeDialogProps {
  recipe: Recipe | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/** Confirms and deletes one of the user's recipes (also removing it from saved, collections and the meal plan). */
export function DeleteRecipeDialog({ recipe, onOpenChange, onDeleted }: DeleteRecipeDialogProps) {
  return (
    <AlertDialog open={recipe !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this recipe?</AlertDialogTitle>
          <AlertDialogDescription>
            “{recipe?.title}” will be permanently removed from this device, along with any saves, collection entries and
            meal-plan slots that use it. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              if (!recipe) return;
              recipesStorage.remove(recipe.id);
              toast(`Deleted “${recipe.title}”`);
              onDeleted?.();
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

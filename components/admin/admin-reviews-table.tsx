"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MessageSquareText, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/skeletons";
import { StarDisplay } from "@/components/shared/star-rating";
import { UserAvatar } from "@/components/shared/user-avatar";
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
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useUserRecipes } from "@/hooks/use-user-recipes";
import { formatDate } from "@/lib/format";
import { useStore } from "@/lib/storage/core";
import { allReviewsStore, loadAllReviews, reviewModeration, type ReviewWithAuthor } from "@/lib/storage/reviews";
import { AdminToolbar } from "./admin-toolbar";
import { ReviewEditDialog } from "./review-edit-dialog";

/** Every review on the site. Admins can edit (e.g. remove offensive words) or delete one. */
export function AdminReviewsTable({ catalogTitles }: { catalogTitles: Record<string, string> }) {
  const hydrated = useHydrated();
  const { isAdmin } = useCurrentUser();
  const reviews = useStore(allReviewsStore);
  const { all: communityRecipes } = useUserRecipes();
  const [search, setSearch] = useState("");
  const [stars, setStars] = useState("all");
  const [editing, setEditing] = useState<ReviewWithAuthor | null>(null);
  const [deleting, setDeleting] = useState<ReviewWithAuthor | null>(null);

  useEffect(() => {
    if (isAdmin) void loadAllReviews();
  }, [isAdmin]);

  const titleOf = useMemo(() => {
    const titles = new Map(Object.entries(catalogTitles));
    for (const recipe of communityRecipes) titles.set(recipe.slug, recipe.title);
    return (slug: string) => titles.get(slug) ?? slug;
  }, [catalogTitles, communityRecipes]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reviews.filter(
      (r) =>
        (stars === "all" || r.rating === Number(stars)) &&
        (!q ||
          r.text.toLowerCase().includes(q) ||
          r.author.name.toLowerCase().includes(q) ||
          r.author.username.includes(q) ||
          titleOf(r.recipeSlug).toLowerCase().includes(q)),
    );
  }, [reviews, search, stars, titleOf]);

  if (!hydrated) return <ListSkeleton rows={6} />;

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareText}
        title="No reviews yet"
        description="Reviews appear here as soon as cooks rate the recipes they've made."
      />
    );
  }

  return (
    <div className="grid gap-5">
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search by text, recipe or reviewer"
        resultCount={visible.length}
        noun="review"
        filters={[
          {
            label: "Filter by rating",
            value: stars,
            onChange: setStars,
            options: [
              { value: "all", label: "All ratings" },
              ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n === 1 ? "" : "s"}` })),
            ],
          },
        ]}
      />
      <div className="overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader className="bg-surface">
            <TableRow>
              <TableHead className="pl-4">Review</TableHead>
              <TableHead className="hidden md:table-cell">Recipe</TableHead>
              <TableHead className="hidden sm:table-cell">Reviewer</TableHead>
              <TableHead className="hidden lg:table-cell">Date</TableHead>
              <TableHead className="w-24 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No reviews match these filters.
                </TableCell>
              </TableRow>
            )}
            {visible.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="max-w-md pl-4 whitespace-normal">
                  <div className="grid gap-1">
                    <span className="flex items-center gap-2">
                      <StarDisplay value={review.rating} />
                      {review.moderatedAt && (
                        <span className="rounded-full bg-muted px-2 py-px text-[0.6875rem] text-muted-foreground">Moderated</span>
                      )}
                    </span>
                    <p className="line-clamp-3 text-sm">{review.text || <span className="text-muted-foreground">No text, rating only</span>}</p>
                    <Link href={`/recipes/${review.recipeSlug}#reviews`} className="text-xs text-muted-foreground hover:text-foreground md:hidden">
                      {titleOf(review.recipeSlug)}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-56 whitespace-normal md:table-cell">
                  <Link href={`/recipes/${review.recipeSlug}#reviews`} className="text-sm font-medium hover:text-primary hover:underline">
                    {titleOf(review.recipeSlug)}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={review.author.name} src={review.author.avatar} className="size-7" />
                    <div className="grid text-sm">
                      <span className="font-medium">{review.author.name}</span>
                      <span className="text-xs text-muted-foreground">@{review.author.username}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">{formatDate(review.createdAt)}</TableCell>
                <TableCell className="pr-4">
                  <div className="flex justify-end gap-0.5">
                    <Button variant="ghost" size="icon-sm" aria-label={`Edit ${review.author.name}'s review`} onClick={() => setEditing(review)}>
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="hover:text-destructive"
                      aria-label={`Delete ${review.author.name}'s review`}
                      onClick={() => setDeleting(review)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ReviewEditDialog review={editing} onClose={() => setEditing(null)} />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this review?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.author.name}&apos;s rating and notes for {deleting ? titleOf(deleting.recipeSlug) : "this recipe"} will be
              removed for everyone. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                reviewModeration.remove(deleting);
                toast("Review deleted");
              }}
            >
              Delete review
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

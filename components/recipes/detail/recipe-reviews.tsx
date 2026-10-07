"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StarDisplay, StarInput, ratingLabel } from "@/components/shared/star-rating";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useRequireUser } from "@/hooks/use-require-user";
import { useRecipeReviews, type RatingSummary, type ReviewWithAuthor } from "@/hooks/use-reviews";
import { formatDate, pluralize } from "@/lib/format";
import { REVIEW_TEXT_MAX } from "@/types/review";
import { useRecipeSession } from "./recipe-session";

export const REVIEW_FORM_ID = "review-form";

/** Average rating link for the recipe header; renders nothing until there are real reviews. */
export function RatingSummaryLink() {
  const { recipe } = useRecipeSession();
  const { summary } = useRecipeReviews(recipe.slug);
  if (summary.count === 0) return null;
  return (
    <a href="#reviews" className="inline-flex w-fit items-center gap-2 text-sm hover:text-primary" data-print-hide>
      <StarDisplay value={summary.average} className="text-base" />
      <span className="font-semibold tabular-nums">{summary.average.toFixed(1)}</span>
      <span className="text-muted-foreground underline-offset-4 hover:underline">
        {pluralize(summary.count, "review")}
      </span>
    </a>
  );
}

export function RecipeReviews() {
  const { recipe } = useRecipeSession();
  const hydrated = useHydrated();
  const { reviews, summary, mine } = useRecipeReviews(recipe.slug);
  const [editing, setEditing] = useState(false);

  if (recipe.status === "draft") return null;

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24" data-print-hide>
      <div className="mb-8">
        <h2 id="reviews-heading" className="text-[1.75rem] font-semibold">
          Reviews
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Cooked it? Tell other cooks how it turned out.</p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[320px_1fr] lg:gap-12">
        <Summary summary={summary} />
        <div className="grid min-w-0 gap-6">
          {hydrated && (!mine || editing) && <Composer key={mine?.id ?? "new"} onDone={() => setEditing(false)} editing={editing} />}
          {reviews.length > 0 && (
            <ul className="grid divide-y border-y" aria-label="Reviews">
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} onEdit={() => setEditing(true)} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Summary({ summary }: { summary: RatingSummary }) {
  if (summary.count === 0) {
    return (
      <div className="grid justify-items-start gap-1.5 border-t pt-5">
        <p className="font-semibold">No reviews yet</p>
        <p className="text-sm text-muted-foreground">Be the first to cook this recipe and share how it went.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-5 border-t pt-5">
      <div className="flex items-end gap-3">
        <span className="font-display text-5xl leading-none font-semibold tabular-nums">{summary.average.toFixed(1)}</span>
        <div className="grid gap-1 pb-0.5">
          <StarDisplay value={summary.average} className="text-lg" />
          <span className="text-sm text-muted-foreground">
            {pluralize(summary.count, "review")}
          </span>
        </div>
      </div>
      <ul className="grid gap-2" aria-label="Rating breakdown">
        {[5, 4, 3, 2, 1].map((stars) => {
          const n = summary.breakdown[stars - 1];
          return (
            <li key={stars} className="flex items-center gap-3 text-sm">
              <span className="flex w-8 items-center gap-1 tabular-nums">
                {stars}
                <Star className="size-3.5 text-saffron" fill="currentColor" strokeWidth={0} aria-hidden />
              </span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-saffron" style={{ width: `${(n / summary.count) * 100}%` }} />
              </span>
              <span className="w-6 text-right text-muted-foreground tabular-nums">{n}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Composer({ editing, onDone }: { editing: boolean; onDone: () => void }) {
  const { recipe } = useRecipeSession();
  const { user } = useCurrentUser();
  const requireUser = useRequireUser();
  const { mine, cookedAt, save } = useRecipeReviews(recipe.slug);
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [text, setText] = useState(mine?.text ?? "");
  const [ticked, setCooked] = useState(false);
  // Finishing cooking mode while this form is open counts too.
  const cooked = ticked || Boolean(mine || cookedAt);
  const [error, setError] = useState("");

  if (!user) {
    return (
      <div id={REVIEW_FORM_ID} className="flex flex-wrap items-center justify-between gap-4 border-t pt-5">
        <div>
          <p className="font-semibold">Cooked this recipe?</p>
          <p className="text-sm text-muted-foreground">Rate it and leave tips for the next cook.</p>
        </div>
        <Button onClick={() => requireUser("Create a free profile to review recipes you've cooked.")}>
          <Star data-icon="inline-start" />
          Write a review
        </Button>
      </div>
    );
  }

  if (recipe.authorId === user.id) {
    return (
      <p className="border-t pt-5 text-sm text-muted-foreground">
        This is your recipe, so reviews are left to other cooks. Share it from your{" "}
        <Link href="/profile" className="font-medium text-foreground underline underline-offset-4">
          profile
        </Link>
        .
      </p>
    );
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!rating) return setError("Choose a star rating.");
    if (!cooked) return setError("Reviews are for cooks who've made the recipe — tick the box once you have.");
    save(recipe.slug, { rating, text });
    toast.success(editing ? "Review updated" : "Thanks for your review!", { description: `${rating} ★ · ${ratingLabel(rating)}` });
    setError("");
    onDone();
  };

  return (
    <form id={REVIEW_FORM_ID} onSubmit={submit} className="grid scroll-mt-24 gap-5 rounded-md border bg-card p-5 sm:p-6" noValidate>
      <div className="grid gap-1">
        <p className="text-lg font-semibold">{editing ? "Edit your review" : "How did it turn out?"}</p>
        <p className="text-sm text-muted-foreground">Posting as {user.name}.</p>
      </div>
      <StarInput id="review-rating" value={rating} onChange={(v) => { setRating(v); setError(""); }} />
      <div className="grid gap-2">
        <Label htmlFor="review-text">
          Your notes <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="review-text"
          value={text}
          maxLength={REVIEW_TEXT_MAX}
          onChange={(e) => setText(e.target.value)}
          placeholder="What worked, what you'd change, any swaps you made…"
          className="min-h-28"
        />
        <span className="justify-self-end text-xs text-muted-foreground tabular-nums">
          {text.length}/{REVIEW_TEXT_MAX}
        </span>
      </div>
      {cookedAt ? (
        <p className="flex items-center gap-2 text-sm text-herb">
          <CheckCircle2 className="size-4" aria-hidden />
          You finished this recipe in cooking mode on {formatDate(cookedAt)}.
        </p>
      ) : (
        <Label htmlFor="review-cooked" className="flex items-center gap-2.5 font-normal">
          <Checkbox id="review-cooked" checked={cooked} onCheckedChange={(v) => { setCooked(v === true); setError(""); }} />
          I&apos;ve cooked this recipe
        </Label>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit">{editing ? "Update review" : "Post review"}</Button>
        {editing && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function ReviewItem({ review, onEdit }: { review: ReviewWithAuthor; onEdit: () => void }) {
  const { user } = useCurrentUser();
  const { remove } = useRecipeReviews(review.recipeSlug);
  const own = user?.id === review.authorId;
  return (
    <li className="grid gap-3 py-5">
      <div className="flex items-start gap-3">
        <UserAvatar name={review.author.name} src={review.author.avatar} className="size-10" />
        <div className="grid min-w-0 flex-1 gap-0.5">
          <p className="truncate font-semibold">
            {review.author.name}
            {own && <span className="font-normal text-muted-foreground"> (you)</span>}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
            <StarDisplay value={review.rating} />
            <span>{ratingLabel(review.rating)}</span>
            <span aria-hidden>·</span>
            <span>
              {formatDate(review.createdAt)}
              {review.updatedAt && " (edited)"}
            </span>
          </div>
        </div>
        {own && (
          <div className="flex shrink-0 gap-0.5">
            <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit your review">
              <Pencil />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="hover:text-destructive" aria-label="Delete your review">
                  <Trash2 />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your review?</AlertDialogTitle>
                  <AlertDialogDescription>Your rating and notes for this recipe will be removed.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      remove(review.id);
                      toast("Review deleted");
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      {review.text && <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line text-pretty">{review.text}</p>}
    </li>
  );
}

"use client";

import { useState } from "react";
import { toast } from "sonner";
import { StarInput } from "@/components/shared/star-rating";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reviewModeration, type ReviewWithAuthor } from "@/lib/storage/reviews";
import { REVIEW_TEXT_MAX } from "@/types/review";

/** Admin moderation: change a review's rating or text (e.g. remove offensive words). */
export function ReviewEditDialog({ review, onClose }: { review: ReviewWithAuthor | null; onClose: () => void }) {
  return (
    <Dialog open={review !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-6 sm:max-w-lg">{review && <EditForm key={review.id} review={review} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function EditForm({ review, onClose }: { review: ReviewWithAuthor; onClose: () => void }) {
  const [rating, setRating] = useState(review.rating);
  const [text, setText] = useState(review.text);

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    reviewModeration.edit(review, { rating, text });
    toast.success("Review updated", { description: `It now shows "Edited by a moderator".` });
    onClose();
  };

  return (
    <form onSubmit={save} className="grid gap-5" noValidate>
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">Edit {review.author.name}&apos;s review</DialogTitle>
        <DialogDescription>
          Use this to fix spam, offensive language or mistakes. Readers will see the review was edited by a moderator.
        </DialogDescription>
      </DialogHeader>
      <StarInput id="moderate-rating" value={rating} onChange={setRating} />
      <div className="grid gap-2">
        <Label htmlFor="moderate-text">Review text</Label>
        <Textarea
          id="moderate-text"
          value={text}
          maxLength={REVIEW_TEXT_MAX}
          onChange={(e) => setText(e.target.value)}
          className="min-h-32"
        />
        <span className="justify-self-end text-xs text-muted-foreground tabular-nums">
          {text.length}/{REVIEW_TEXT_MAX}
        </span>
      </div>
      <DialogFooter className="-mx-6 -mb-6 px-6">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );
}

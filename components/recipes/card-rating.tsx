"use client";

import { Star } from "lucide-react";
import { useRatingSummary } from "@/hooks/use-reviews";

/** "★ 4.5 (2)" from real reviews; renders nothing for unreviewed recipes. */
export function CardRating({ slug }: { slug: string }) {
  const summary = useRatingSummary(slug);
  if (!summary) return null;
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Rated ${summary.average.toFixed(1)} out of 5 from ${summary.count} reviews`}
    >
      <Star className="size-3.5 text-saffron" fill="currentColor" strokeWidth={0} aria-hidden />
      <span className="font-semibold text-foreground tabular-nums">{summary.average.toFixed(1)}</span>
      <span className="tabular-nums">({summary.count})</span>
    </span>
  );
}

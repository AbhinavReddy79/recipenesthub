"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const LABELS = ["Didn't work for me", "It was okay", "Good", "Really good", "Loved it"];
export const ratingLabel = (rating: number) => LABELS[rating - 1] ?? "";

/** Read-only stars; supports halves via a clipped overlay. */
export function StarDisplay({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - n + 1));
        return (
          <span key={n} className="relative inline-flex">
            <Star className="size-[1em] text-border" fill="currentColor" strokeWidth={0} aria-hidden />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className="size-[1em] text-saffron" fill="currentColor" strokeWidth={0} aria-hidden />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/** 1–5 star picker, keyboard-accessible as a radio group. */
export function StarInput({ value, onChange, id }: { value: number; onChange: (value: number) => void; id?: string }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div id={id} role="radiogroup" aria-label="Your rating" className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} ${n === 1 ? "star" : "stars"} — ${ratingLabel(n)}`}
            tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault();
                onChange(Math.min(5, (value || 0) + 1));
              }
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault();
                onChange(Math.max(1, (value || 2) - 1));
              }
            }}
            className="rounded-md p-1 transition-transform outline-none hover:scale-110 focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Star
              className={cn("size-8 transition-colors", n <= shown ? "text-saffron" : "text-border")}
              fill="currentColor"
              strokeWidth={0}
              aria-hidden
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-muted-foreground" aria-live="polite">
        {shown ? ratingLabel(shown) : "Tap a star to rate"}
      </span>
    </div>
  );
}

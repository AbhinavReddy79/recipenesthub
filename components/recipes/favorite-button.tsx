"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/use-favorites";
import { useHydrated } from "@/hooks/use-hydrated";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  slug: string;
  title: string;
  variant?: "overlay" | "button";
  className?: string;
}

export function FavoriteButton({ slug, title, variant = "overlay", className }: FavoriteButtonProps) {
  const { isFavorite, toggle } = useFavorites();
  const hydrated = useHydrated();
  const [popKey, setPopKey] = useState(0);
  const saved = hydrated && isFavorite(slug);

  const onClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!saved) setPopKey((k) => k + 1);
    toggle(slug, title);
  };

  const heart = (
    <Heart
      key={popKey}
      className={cn(
        "size-4 transition-colors",
        saved ? "fill-terracotta text-terracotta" : "text-current",
        popKey > 0 && saved && "animate-heart-pop",
      )}
      aria-hidden
    />
  );

  if (variant === "button") {
    return (
      <Button
        variant="outline"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(saved && "text-terracotta", className)}
      >
        {heart}
        {saved ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
      className={cn(
        "relative z-10 flex size-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow-soft transition hover:scale-105 hover:bg-background",
        className,
      )}
    >
      {heart}
    </button>
  );
}

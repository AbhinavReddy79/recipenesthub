import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cuisine } from "@/types/recipe";

interface CuisineCardProps {
  cuisine: Cuisine;
  count: number;
  className?: string;
  showDescription?: boolean;
  /** Tall portrait tile for tight rows (homepage); 4:3 otherwise. */
  compact?: boolean;
}

/** Full-bleed photo with the cuisine name set over a soft shade at the bottom. */
export function CuisineCard({ cuisine, count, className, showDescription = false, compact = false }: CuisineCardProps) {
  return (
    <Link
      href={`/cuisines/${cuisine.slug}`}
      className={cn(
        "group relative isolate flex flex-col justify-end overflow-hidden rounded-2xl bg-ink shadow-card ring-1 ring-border/70 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lift",
        compact ? "aspect-[3/4]" : "aspect-[4/3]",
        className,
      )}
    >
      <Image
        src={cuisine.image}
        alt=""
        fill
        sizes={compact ? "(min-width: 1280px) 170px, (min-width: 768px) 25vw, 50vw" : "(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"}
        className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/45 to-black/5" />

      <span className={cn("grid gap-1 text-white", compact ? "p-3.5" : "p-5 sm:p-6")}>
        {!compact && (
          <span className="text-[0.6875rem] font-bold tracking-[0.16em] text-white/75 uppercase">{cuisine.region}</span>
        )}
        <span className={cn("font-display leading-tight font-semibold", compact ? "text-lg hyphens-auto xl:text-[1.0625rem]" : "text-[1.75rem]")}>
          {cuisine.name}
        </span>
        {showDescription && <span className="line-clamp-2 text-sm text-pretty text-white/80">{cuisine.description}</span>}
        <span className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-white/85">
          {count} {count === 1 ? "recipe" : "recipes"}
          <ArrowRight
            className="size-3.5 -translate-x-1 opacity-0 transition duration-300 group-hover:translate-x-0 group-hover:opacity-100"
            aria-hidden
          />
        </span>
      </span>
    </Link>
  );
}

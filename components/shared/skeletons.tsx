import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function RecipeCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-card ring-1 ring-border/70", className)} aria-hidden>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="grid gap-3 p-4 sm:p-5">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="mt-2 h-4 w-2/5" />
      </div>
    </div>
  );
}

export function RecipeGridSkeleton({ count = 8, columns = 4 }: { count?: number; columns?: 3 | 4 }) {
  return (
    <div
      role="status"
      aria-label="Loading recipes"
      className={cn(
        "grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6",
        columns === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "lg:grid-cols-3",
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <RecipeCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function RecipeDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading recipe" className="container-page py-8">
      <Skeleton className="h-4 w-64" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        <div className="grid content-start gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-11 w-48" />
        </div>
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-[380px_1fr]">
        <div className="grid content-start gap-3">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
        <div className="grid content-start gap-4">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile" className="container-page py-10">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-end">
        <Skeleton className="size-28 rounded-full" />
        <div className="grid flex-1 gap-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <div className="flex gap-6">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>
      <Skeleton className="mt-10 h-10 w-full max-w-md" />
      <div className="mt-8">
        <RecipeGridSkeleton count={4} />
      </div>
    </div>
  );
}

export function CommunitySkeleton() {
  return (
    <div role="status" aria-label="Loading community" className="container-page grid gap-14 py-12">
      <RecipeGridSkeleton count={4} />
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="grid gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-xl" />
      ))}
    </div>
  );
}

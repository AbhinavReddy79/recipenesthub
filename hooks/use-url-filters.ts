import { useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CATEGORY_SLUGS, CUISINE_SLUGS } from "@/lib/labels";
import { filtersFromParams, filtersToParams } from "@/lib/recipes/query";
import type { RecipeFilters, RecipeSort } from "@/types/recipe";

/**
 * Recipe filters with the URL as the single source of truth, so filtered
 * views are shareable and survive refresh. Updates use the History API,
 * which Next.js keeps in sync with `useSearchParams` without a server round-trip.
 */
export function useUrlFilters() {
  const searchParams = useSearchParams();
  const { filters, sort } = useMemo(
    () => filtersFromParams(searchParams, CUISINE_SLUGS, CATEGORY_SLUGS),
    [searchParams],
  );

  const write = useCallback((next: RecipeFilters, nextSort: RecipeSort) => {
    const query = filtersToParams(next, nextSort).toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, []);

  const setFilters = useCallback(
    (update: Partial<RecipeFilters>) => write({ ...filters, ...update }, sort),
    [filters, sort, write],
  );
  const setSort = useCallback((next: RecipeSort) => write(filters, next), [filters, write]);
  const replaceFilters = useCallback((next: RecipeFilters) => write(next, sort), [sort, write]);

  return { filters, sort, setFilters, setSort, replaceFilters };
}

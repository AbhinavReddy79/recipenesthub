import { NextResponse } from "next/server";
import { formatMinutes } from "@/lib/format";
import { CUISINE_LABELS } from "@/lib/labels";
import { totalMinutes } from "@/lib/recipes/query";
import { listRecipes } from "@/lib/services/recipes";
import type { SearchIndexItem } from "@/components/layout/search-command";

// Built once from the catalog and served from the CDN. The quick search loads
// it when it's first opened, so pages don't carry it.
export const dynamic = "force-static";

export async function GET() {
  const recipes = await listRecipes();
  const index: SearchIndexItem[] = recipes.map((r) => ({
    slug: r.slug,
    title: r.title,
    image: r.image,
    meta: `${CUISINE_LABELS[r.cuisine]} · ${formatMinutes(totalMinutes(r))} · ${r.difficulty}`,
    keywords: [r.cuisine, r.state, r.mealType, ...r.diets, ...(r.tags ?? [])].filter(Boolean).join(" "),
  }));
  return NextResponse.json(index);
}

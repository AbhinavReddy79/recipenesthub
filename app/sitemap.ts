import type { MetadataRoute } from "next";
import { listCuisines } from "@/lib/services/catalog";
import { listRecipes } from "@/lib/services/recipes";
import { siteConfig } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [recipes, cuisines] = await Promise.all([listRecipes(), listCuisines()]);
  const base = siteConfig.url;
  const staticRoutes = ["", "/recipes", "/search", "/ingredients", "/cuisines", "/community", "/privacy", "/terms", "/contact", "/pricing", "/contests", "/lucky-draw", "/meal-planner"].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  return [
    ...staticRoutes,
    ...recipes.map((r) => ({ url: `${base}/recipes/${r.slug}`, lastModified: r.createdAt, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...cuisines.map((c) => ({ url: `${base}/cuisines/${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}

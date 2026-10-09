import { AdminReviewsTable } from "@/components/admin/admin-reviews-table";
import { listCatalogRows } from "@/lib/services/admin";

export const metadata = { title: "Reviews" };

export default async function AdminReviewsPage() {
  const catalog = await listCatalogRows();
  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-semibold sm:text-4xl">Reviews</h1>
        <p className="mt-1 text-muted-foreground">Every review on RecipeNest. Edit or remove anything that breaks the rules.</p>
      </header>
      <AdminReviewsTable catalogTitles={Object.fromEntries(catalog.map((r) => [r.slug, r.title]))} />
    </div>
  );
}

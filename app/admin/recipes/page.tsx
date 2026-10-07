import { AdminRecipesTable } from "@/components/admin/admin-recipes-table";
import { listCatalogRows } from "@/lib/services/admin";

export const metadata = { title: "Recipes" };

export default async function AdminRecipesPage({ searchParams }: PageProps<"/admin/recipes">) {
  const [{ source }, catalog] = await Promise.all([searchParams, listCatalogRows()]);
  return (
    <div className="grid gap-8">
      <header>
        <h1 className="text-3xl font-semibold sm:text-4xl">Recipes</h1>
        <p className="mt-1 text-muted-foreground">The official catalog and recipes shared by users.</p>
      </header>
      <AdminRecipesTable catalog={catalog} initialSource={source === "user" || source === "platform" ? source : "all"} />
    </div>
  );
}

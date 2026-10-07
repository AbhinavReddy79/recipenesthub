import type { Metadata } from "next";
import { ShoppingBasket } from "lucide-react";
import { RequireProfile } from "@/components/auth/require-profile";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import { ShoppingList } from "@/components/shopping/shopping-list";
import { listRecipes } from "@/lib/services/recipes";

export const metadata: Metadata = {
  title: "Shopping List",
  robots: { index: false },
};

export default async function ShoppingListPage() {
  const recipes = await listRecipes();
  return (
    <ModuleTone tone="ocean">
      <PageHeader
        icon={<ShoppingBasket />}
        eyebrow="Groceries"
        title="Shopping list"
        description="Generated from your meal plan and grouped by aisle. Check things off as you shop."
      />
      <div className="container-page py-10 pb-24">
        <RequireProfile
          icon={<ShoppingBasket />}
          title="Your shopping list, sorted by aisle"
          description="Create a free profile to keep a shopping list — add items yourself or generate one from your meal plan."
        >
          <ShoppingList recipes={recipes} />
        </RequireProfile>
      </div>
    </ModuleTone>
  );
}

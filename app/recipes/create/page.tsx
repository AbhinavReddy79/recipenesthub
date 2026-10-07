import type { Metadata } from "next";
import { ChefHat } from "lucide-react";
import { RecipeFormPage } from "@/components/forms/recipe-form/recipe-form-page";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Create a Recipe",
  description: "Share your recipe with the RecipeNest community.",
  robots: { index: false },
};

export default function CreateRecipePage() {
  return (
    <ModuleTone tone="brand">
      <PageHeader
        icon={<ChefHat />}
        eyebrow="Share your cooking"
        title="Create a recipe"
        description="Walk through six quick steps. Your progress is saved automatically as you go."
      />
      <div className="container-page py-10 pb-24">
        <RecipeFormPage />
      </div>
    </ModuleTone>
  );
}

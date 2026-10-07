import type { Metadata } from "next";
import { Pencil } from "lucide-react";
import { RecipeFormPage } from "@/components/forms/recipe-form/recipe-form-page";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Edit Recipe",
  robots: { index: false },
};

export default async function EditRecipePage({ params }: PageProps<"/my-recipes/[id]/edit">) {
  const { id } = await params;
  return (
    <ModuleTone tone="brand">
      <PageHeader
        icon={<Pencil />}
        eyebrow="My recipes"
        title="Edit recipe"
        description="Update any step, then save or publish."
      />
      <div className="container-page py-10 pb-24">
        <RecipeFormPage editId={id} />
      </div>
    </ModuleTone>
  );
}

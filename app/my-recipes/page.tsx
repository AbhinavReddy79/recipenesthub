import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { RequireProfile } from "@/components/auth/require-profile";
import { MyRecipesView } from "@/components/recipes/my-recipes-view";
import { ModuleTone } from "@/components/shared/module-tone";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "My Recipes",
  robots: { index: false },
};

export default function MyRecipesPage() {
  return (
    <ModuleTone tone="brand">
      <PageHeader
        icon={<BookOpen />}
        eyebrow="Your kitchen"
        title="My recipes"
        description="Recipes you've created — publish them to the community or keep refining your drafts."
        actions={
          <Button asChild size="lg">
            <Link href="/recipes/create">
              <Plus data-icon="inline-start" />
              New recipe
            </Link>
          </Button>
        }
      />
      <div className="container-page py-10 pb-24">
        <RequireProfile
          icon={<BookOpen />}
          title="Share your recipes with RecipeNest"
          description="Create a free profile to write, publish and manage your own recipes."
        >
          <MyRecipesView />
        </RequireProfile>
      </div>
    </ModuleTone>
  );
}

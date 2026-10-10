"use client";

import Link from "next/link";
import { BookOpen, Crown, Plus } from "lucide-react";
import { CollectionsGrid } from "@/components/collections/collections-view";
import { RecipeGrid } from "@/components/recipes/recipe-grid";
import { SavedView } from "@/components/recipes/saved-view";
import { EmptyState } from "@/components/shared/empty-state";
import { ProfileSkeleton } from "@/components/shared/skeletons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollections } from "@/hooks/use-collections";
import { useFavorites } from "@/hooks/use-favorites";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSettings } from "@/hooks/use-settings";
import { useUserRecipes } from "@/hooks/use-user-recipes";
import { CUISINE_LABELS } from "@/lib/labels";
import { usePlan } from "@/lib/storage/plan";
import type { Recipe } from "@/types/recipe";
import { EditProfileDialog } from "./edit-profile-dialog";
import { ProfileHeader } from "./profile-header";

export function ProfileView({ recipes }: { recipes: Recipe[] }) {
  const hydrated = useHydrated();
  const { user: profile } = useCurrentUser();
  const { myPublished: published } = useUserRecipes();
  const { count: savedCount } = useFavorites();
  const { collections } = useCollections();
  const { preferences } = useSettings();
  const plan = usePlan();

  if (!hydrated || !profile) return <ProfileSkeleton />;

  return (
    <>
      <ProfileHeader
        name={profile.name}
        username={profile.username}
        avatar={profile.avatar}
        bio={profile.bio}
        location={profile.location}
        joinedAt={profile.createdAt}
        greeting={`Welcome, ${profile.name.split(" ")[0]}`}
        badge={
          plan.premium && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 rounded-full bg-metallic-gold px-3 py-1 text-xs font-bold text-[oklch(0.2_0.006_70)] uppercase shadow-soft"
            >
              <Crown className="size-3.5" aria-hidden />
              Premium
            </Link>
          )
        }
        extra={
          (preferences.diet !== "None" || preferences.favoriteCuisines.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {preferences.diet !== "None" && <Badge variant="secondary">{preferences.diet}</Badge>}
              {preferences.favoriteCuisines.map((c) => (
                <Badge key={c} asChild variant="outline">
                  <Link href={`/cuisines/${c}`}>{CUISINE_LABELS[c]}</Link>
                </Badge>
              ))}
            </div>
          )
        }
        stats={[
          { label: "Saved recipes", value: savedCount },
          { label: "Collections", value: collections.length },
          { label: "Created recipes", value: published.length },
        ]}
        actions={
          <>
            <EditProfileDialog />
            <Button asChild size="lg">
              <Link href="/recipes/create">
                <Plus data-icon="inline-start" />
                New recipe
              </Link>
            </Button>
          </>
        }
      />

      <div className="container-page py-10 pb-24">
        <Tabs defaultValue="recipes" className="gap-8">
          <div className="-mx-4 overflow-x-auto px-4 scrollbar-none">
            <TabsList variant="line" className="w-max gap-4">
              <TabsTrigger value="recipes">My Recipes</TabsTrigger>
              <TabsTrigger value="saved">Saved</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="recipes">
            {published.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Share your first recipe."
                description="Publish a family favourite and it'll show up here and across RecipeNest."
                actions={
                  <Button asChild size="lg">
                    <Link href="/recipes/create">Create a recipe</Link>
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-6">
                <div className="flex justify-end">
                  <Button asChild variant="outline">
                    <Link href="/my-recipes">Manage recipes & drafts</Link>
                  </Button>
                </div>
                <RecipeGrid recipes={published} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved">
            <SavedView recipes={recipes} />
          </TabsContent>

          <TabsContent value="collections">
            <CollectionsGrid recipes={recipes} />
          </TabsContent>

        </Tabs>
      </div>
    </>
  );
}

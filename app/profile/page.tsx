import type { Metadata } from "next";
import { CircleUser } from "lucide-react";
import { RequireProfile } from "@/components/auth/require-profile";
import { ProfileView } from "@/components/profile/profile-view";
import { ProfileSkeleton } from "@/components/shared/skeletons";
import { listRecipes } from "@/lib/services/recipes";

export const metadata: Metadata = {
  title: "Your Profile",
  robots: { index: false },
};

export default async function ProfilePage() {
  const recipes = await listRecipes();
  return (
    <RequireProfile
      icon={<CircleUser />}
      title="Make RecipeNest yours"
      description="Create a free profile to save recipes, build collections, plan meals and share your own recipes."
      gateClassName="container-page py-16"
      fallback={<ProfileSkeleton />}
    >
      <ProfileView recipes={recipes} />
    </RequireProfile>
  );
}

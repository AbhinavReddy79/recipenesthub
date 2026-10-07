"use client";

import Link from "next/link";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useCollections } from "@/hooks/use-collections";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useFavorites } from "@/hooks/use-favorites";
import { useHydrated } from "@/hooks/use-hydrated";
import { useMealPlan } from "@/hooks/use-meal-plan";
import { useUserRecipes } from "@/hooks/use-user-recipes";

/** A personal greeting with the user's real counts. Visitors don't see it. */
export function WelcomeBar() {
  const hydrated = useHydrated();
  const { user } = useCurrentUser();
  const { count: saved } = useFavorites();
  const { collections } = useCollections();
  const { mealCount } = useMealPlan();
  const { mine } = useUserRecipes();
  if (!hydrated || !user) return null;

  const firstName = user.name.split(" ")[0];
  const isNew = saved + collections.length + mealCount + mine.length === 0;
  const stats = [
    { label: "saved", value: saved, href: "/saved" },
    { label: collections.length === 1 ? "collection" : "collections", value: collections.length, href: "/collections" },
    { label: mealCount === 1 ? "planned meal" : "planned meals", value: mealCount, href: "/meal-planner" },
    { label: mine.length === 1 ? "recipe" : "recipes", value: mine.length, href: "/my-recipes" },
  ];

  return (
    <div className="border-b bg-gradient-to-r from-primary/10 via-saffron/10 to-herb/10">
      <div className="container-page flex flex-col gap-2.5 py-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
        <div className="flex items-center gap-2.5">
          <UserAvatar name={user.name} src={user.avatar} className="size-8 ring-2 ring-primary/40 animate-pop" />
          <p>
            <span className="font-medium">Welcome{isNew ? "" : " back"}, {firstName}.</span>{" "}
            <span className="hidden text-muted-foreground sm:inline">
              {isNew ? "Save a recipe to start your cookbook." : "Here's your kitchen at a glance."}
            </span>
          </p>
        </div>
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:ml-auto sm:flex-wrap sm:gap-x-4 sm:gap-y-1 sm:overflow-visible sm:px-0" aria-label="Your activity">
          {stats.map((stat) => (
            <li key={stat.href}>
              <Link href={stat.href} className="flex h-8 items-center gap-1 whitespace-nowrap rounded-full bg-card/80 px-3 text-muted-foreground ring-1 ring-border/70 hover:text-foreground sm:h-auto sm:rounded-none sm:bg-transparent sm:px-0 sm:ring-0 sm:hover:underline sm:hover:underline-offset-4">
                <span className="font-bold text-primary tabular-nums">{stat.value}</span> {stat.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/profile" className="flex h-8 items-center whitespace-nowrap rounded-full bg-primary px-3 font-semibold text-primary-foreground sm:h-auto sm:bg-transparent sm:px-0 sm:text-foreground sm:hover:underline sm:hover:underline-offset-4">
              Profile
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}

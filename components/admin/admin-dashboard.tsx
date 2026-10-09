"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ChefHat, Star, UserPlus, Users } from "lucide-react";
import { ListSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useAccounts } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useReviewCount } from "@/hooks/use-reviews";
import { useUserRecipes } from "@/hooks/use-user-recipes";
import { formatDate } from "@/lib/format";
import { FALLBACK_RECIPE_IMAGE } from "@/lib/images";
import { StatusBadge } from "./status-badge";

/** Every number here is calculated from real data — nothing is hardcoded. */
export function AdminDashboard({ platformRecipes }: { platformRecipes: number }) {
  const hydrated = useHydrated();
  const { accounts } = useAccounts();
  const { all, published } = useUserRecipes();
  const reviews = useReviewCount();
  if (!hydrated) return <ListSkeleton rows={6} />;

  const cards = [
    { label: "Platform recipes", value: platformRecipes, note: "Official RecipeNest catalog", icon: BookOpen, href: "/admin/recipes", tone: "brand" },
    { label: "Users", value: accounts.length, note: accounts.length ? "Registered accounts" : "No profiles yet", icon: Users, href: "/admin/users", tone: "ocean" },
    { label: "User recipes", value: all.length, note: `${published.length} published · ${all.length - published.length} drafts`, icon: ChefHat, href: "/admin/recipes?source=user", tone: "herb" },
    { label: "Reviews", value: reviews, note: reviews ? "Left by the community" : "No reviews yet", icon: Star, href: "/admin/reviews", tone: "amber" },
  ];
  const newestRecipes = [...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const newestUsers = [...accounts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  return (
    <div className="grid gap-10">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, note, icon: Icon, href, tone }) => (
          <li key={label} data-tone={tone}>
            <Link
              href={href}
              className="group relative grid gap-3 overflow-hidden rounded-2xl border bg-card p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span aria-hidden className="absolute -top-10 -right-10 size-28 rounded-full bg-tone-soft transition-transform duration-500 group-hover:scale-150" />
              <div className="relative flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
                <span className="flex size-10 items-center justify-center rounded-xl bg-tone text-tone-foreground shadow-soft transition-transform duration-300 group-hover:-rotate-6">
                  <Icon className="size-4.5" aria-hidden />
                </span>
              </div>
              <p className="relative font-display text-4xl font-semibold text-tone tabular-nums">{value.toLocaleString("en-US")}</p>
              <p className="relative text-xs text-muted-foreground">{note}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="recent-recipes-heading" className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <header className="flex items-center justify-between border-b bg-primary/5 p-5">
            <h2 id="recent-recipes-heading" className="flex items-center gap-2 font-sans text-base font-semibold tracking-normal">
              <ChefHat className="size-4 text-primary" aria-hidden />
              Newest user recipes
            </h2>
            <Link href="/admin/recipes?source=user" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Manage <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </header>
          {newestRecipes.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No one has shared a recipe yet. New submissions will appear here.</p>
          ) : (
            <ul className="divide-y">
              {newestRecipes.map((recipe) => (
                <li key={recipe.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image src={recipe.image || FALLBACK_RECIPE_IMAGE} alt="" fill sizes="44px" className="object-cover" />
                  </span>
                  <div className="grid min-w-0 flex-1">
                    <span className="truncate text-sm font-medium">{recipe.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {recipe.author.name} · {formatDate(recipe.createdAt)}
                    </span>
                  </div>
                  <StatusBadge status={recipe.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="members-heading" className="overflow-hidden rounded-2xl border bg-card shadow-card">
          <header className="flex items-center justify-between border-b bg-herb-soft/60 p-5">
            <h2 id="members-heading" className="flex items-center gap-2 font-sans text-base font-semibold tracking-normal">
              <UserPlus className="size-4 text-herb" aria-hidden />
              Newest profiles
            </h2>
            <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Manage users <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </header>
          {newestUsers.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No profiles have been created yet.</p>
          ) : (
            <ul className="divide-y">
              {newestUsers.map((user) => (
                <li key={user.id} className="flex items-center gap-3 px-5 py-3">
                  <UserAvatar name={user.name} src={user.avatar} className="size-9" />
                  <div className="grid min-w-0 flex-1">
                    <span className="truncate text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">Joined {formatDate(user.createdAt)}</span>
                  </div>
                  <StatusBadge status={user.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

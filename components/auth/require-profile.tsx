"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useAuthDialog } from "./auth-dialog";

interface RequireProfileProps {
  /** A rendered icon, e.g. <BookHeart />. (Elements, not components, can come from server pages.) */
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  fallback?: ReactNode;
  /** Extra classes for the sign-up panel (e.g. a page container on full-bleed pages). */
  gateClassName?: string;
}

/**
 * Personal areas (cookbook, collections, planner…) belong to a profile.
 * Visitors get an inviting sign-up panel instead of an empty page.
 */
export function RequireProfile({ icon, title, description, children, fallback, gateClassName }: RequireProfileProps) {
  const hydrated = useHydrated();
  const { user } = useCurrentUser();
  const { openAuth } = useAuthDialog();

  if (!hydrated) return fallback ?? <ListSkeleton rows={4} />;
  if (user) return <>{children}</>;

  return (
    <div className={gateClassName}>
    <section
      aria-labelledby="profile-gate-title"
      className="relative isolate grid justify-items-center gap-5 overflow-hidden rounded-3xl bg-warm-glow px-6 py-14 text-center ring-1 ring-border/70 sm:py-16"
    >
      <div aria-hidden className="absolute inset-0 -z-10 bg-dots opacity-70 [mask-image:radial-gradient(closest-side,black,transparent)]" />
      <span aria-hidden className="relative flex size-16 items-center justify-center rounded-2xl bg-tone text-tone-foreground shadow-lift animate-float [&>svg]:size-8 [&>svg]:stroke-[1.75]">
        {icon}
      </span>
      <div className="relative grid max-w-md gap-2">
        <h2 id="profile-gate-title" className="text-2xl font-semibold sm:text-3xl">
          {title}
        </h2>
        <p className="text-pretty text-muted-foreground">{description}</p>
      </div>
      <div className="relative flex flex-wrap justify-center gap-2">
        <Button size="lg" onClick={() => openAuth("register")}>
          Create free profile
        </Button>
        <Button size="lg" variant="outline" onClick={() => openAuth("login")}>
          Log in
        </Button>
      </div>
      <p className="relative text-sm text-muted-foreground">
        Or keep exploring{" "}
        <Link href="/recipes" className="font-medium text-foreground underline underline-offset-4">
          the recipe catalog
        </Link>{" "}
        — no account needed.
      </p>
    </section>
    </div>
  );
}

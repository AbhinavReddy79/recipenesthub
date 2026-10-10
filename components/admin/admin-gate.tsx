"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { ADMIN_POWER_LABELS, useAdminPowers, type AdminPower } from "@/lib/storage/admin-powers";

/** Which power each admin section needs (the dashboard needs none). */
export const SECTION_POWER: Record<string, AdminPower> = {
  "/admin/recipes": "moderate",
  "/admin/reviews": "moderate",
  "/admin/users": "members",
  "/admin/contests": "contests",
  "/admin/messages": "messages",
};

const sectionPower = (pathname: string) =>
  Object.entries(SECTION_POWER).find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1];

/**
 * Hides the admin console from everyone except admins. This only shapes the UI:
 * the database enforces admin rights itself (RLS policies and admin-only RPCs).
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const { isAdmin } = useCurrentUser();
  const powers = useAdminPowers();
  const pathname = usePathname();
  const needed = sectionPower(pathname);

  if (!hydrated || (isAdmin && !powers.loaded)) return <ListSkeleton rows={6} />;
  if (isAdmin && (!needed || powers[needed])) return <>{children}</>;
  if (isAdmin && needed) {
    return (
      <section className="container-page grid justify-items-center gap-4 py-24 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <ShieldOff className="size-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-semibold sm:text-3xl">Not part of your admin role</h1>
        <p className="max-w-md text-muted-foreground">
          “{ADMIN_POWER_LABELS[needed].label}” hasn&apos;t been switched on for you. Ask the site owner if you need it.
        </p>
        <Button asChild size="lg">
          <Link href="/admin">Back to the dashboard</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="container-page grid justify-items-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <ShieldOff className="size-7" aria-hidden />
      </span>
      <h1 className="text-2xl font-semibold sm:text-3xl">Admins only</h1>
      <p className="max-w-md text-muted-foreground">You need an admin account to view this page.</p>
      <Button asChild size="lg">
        <Link href="/">Back to home</Link>
      </Button>
    </section>
  );
}

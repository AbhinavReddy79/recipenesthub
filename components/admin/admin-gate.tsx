"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Hides the admin console from everyone except admins. This only shapes the UI:
 * the database enforces admin rights itself (RLS policies and admin-only RPCs).
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const { isAdmin } = useCurrentUser();

  if (!hydrated) return <ListSkeleton rows={6} />;
  if (isAdmin) return <>{children}</>;

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

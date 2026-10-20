"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crown, PartyPopper, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePlan } from "@/lib/storage/plan";
import type { UserProfile } from "@/types/user";
import { Confetti } from "./launch-celebration";

/** Accounts created in the last week count as new. */
const NEW_FOR_MS = 7 * 24 * 3600_000;
const WELCOMED_KEY = "rn-new-member-welcomed";

export const isNewMember = (user: Pick<UserProfile, "createdAt"> | null, now = Date.now()) =>
  Boolean(user?.createdAt) && now - Date.parse(user!.createdAt) < NEW_FOR_MS;

const welcomed = (key: string) => {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

/**
 * A new member's first visit to the home page after signing in: a confetti burst
 * and a welcome card with their free Premium month. Once per account.
 * In development, add ?welcome=preview&name=Abhi to any page to see it.
 */
export function NewMemberWelcome() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const plan = usePlan();
  const [show, setShow] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [preview, setPreview] = useState<{ name: string; until: string } | null>(null);
  const endConfetti = useCallback(() => setConfetti(false), []);
  const userId = user?.id ?? null;
  const createdAt = user?.createdAt ?? null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const previewing = process.env.NODE_ENV === "development" && params.get("welcome") === "preview";
    if (!previewing && (!userId || !isNewMember({ createdAt: createdAt ?? "" }) || pathname !== "/")) return;
    const key = `${WELCOMED_KEY}:${userId ?? "preview"}`;
    if (!previewing && welcomed(key)) return;
    // Let the page settle first, so the burst is noticed.
    const timer = window.setTimeout(() => {
      if (previewing) setPreview({ name: params.get("name") ?? "there", until: new Date(Date.now() + 30 * 24 * 3600_000).toISOString() });
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setConfetti(true);
      setShow(true);
      try {
        localStorage.setItem(key, "1");
      } catch {
        // Private mode: they may see the welcome once more.
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [pathname, userId, createdAt]);

  const firstName = (user?.name ?? preview?.name ?? "").trim().split(/\s+/)[0] || "there";
  const until = preview
    ? preview.until
    : plan.loaded && plan.premium
      ? plan.premiumUntil
      : null;
  const untilLabel = until ? new Date(until).toLocaleDateString("en-IN", { day: "numeric", month: "long", timeZone: "Asia/Kolkata" }) : null;

  return (
    <>
      {confetti && <Confetti onDone={endConfetti} />}
      {show && (
        <div
          role="status"
          className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[210] mx-auto max-w-lg animate-pop rounded-2xl bg-metallic-charcoal p-4 text-white shadow-lift ring-2 ring-saffron/60 md:bottom-6"
        >
          <button
            type="button"
            onClick={() => setShow(false)}
            aria-label="Close"
            className="absolute top-2 right-2 rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
          <p className="inline-flex items-center gap-2 pr-6 font-display text-xl font-semibold">
            <PartyPopper className="size-5 text-gold-light" aria-hidden />
            Welcome to RecipeNest, {firstName}!
          </p>
          {untilLabel ? (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-white/85">
              <Crown className="size-4 shrink-0 text-gold-light" aria-hidden />
              Your free month of Premium is active until {untilLabel}.
            </p>
          ) : (
            <p className="mt-1 text-sm text-white/80">We&apos;re so glad you&apos;re here. Start cooking, saving and sharing.</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
            <Link
              href="/recipes/create"
              onClick={() => setShow(false)}
              className="rounded-full bg-metallic-gold px-3 py-1.5 text-[oklch(0.2_0.006_70)] hover:opacity-95"
            >
              Share your first recipe
            </Link>
            <Link href="/recipes" onClick={() => setShow(false)} className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20 hover:bg-white/15">
              Explore recipes
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

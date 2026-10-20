"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PartyPopper, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { COMING_SOON_PATH, LAUNCH_AT } from "@/lib/launch";
import { getSupabase } from "@/lib/supabase/client";

/** The celebration runs on launch day only: until midnight after the launch (India time). */
const CELEBRATE_UNTIL = new Date("2026-10-21T00:00:00+05:30").getTime();
const SEEN_KEY = "rn-launch-confetti-seen";
const CLOSED_KEY = "rn-launch-banner-closed";

const read = (key: string) => {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};
const remember = (key: string) => {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // Private mode or blocked storage: the celebration may simply show again.
  }
};

/**
 * Launch day: a short confetti burst and a "We're live!" banner for everyone,
 * once the owner has pressed Launch: once as a visitor, and once more for each
 * account when it signs in (with a personal welcome). Gone after launch day.
 * In development, add ?celebrate=preview (and &name=Abhi for the signed-in look) to any page.
 */
export function LaunchCelebration() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const userId = user?.id ?? null;
  // New accounts get the new-member welcome (NewMemberWelcome) instead, so nobody gets two bursts.
  const createdAt = user?.createdAt ?? null;
  const [show, setShow] = useState(false);
  const [previewName, setPreviewName] = useState<string | null>(null);
  const [confetti, setConfetti] = useState(false);
  const endConfetti = useCallback(() => setConfetti(false), []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preview = process.env.NODE_ENV === "development" && params.get("celebrate") === "preview";
    // Each account celebrates once on sign-in, separately from the visitor celebration.
    const seenKey = userId ? `${SEEN_KEY}:${userId}` : SEEN_KEY;
    const closedKey = userId ? `${CLOSED_KEY}:${userId}` : CLOSED_KEY;
    if (!preview) {
      const newMember = Boolean(createdAt) && Date.now() - Date.parse(createdAt ?? "") < 7 * 24 * 3600_000;
      if (pathname === COMING_SOON_PATH || newMember) return;
      const now = Date.now();
      if (now < LAUNCH_AT.getTime() - 6 * 3600_000 || now >= CELEBRATE_UNTIL) return;
      if (read(closedKey) && read(seenKey)) return;
    }
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      if (preview) setPreviewName(params.get("name"));
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (preview || !read(seenKey)) {
        if (!calm) setConfetti(true);
        remember(seenKey);
      }
      if (preview || !read(closedKey)) setShow(true);
    };
    if (preview) {
      start();
    } else {
      // Only once the owner has actually launched (early-access members browse before that).
      void getSupabase()
        ?.rpc("site_is_launched")
        .then(({ data }) => data === true && start());
    }
    return () => {
      cancelled = true;
    };
  }, [pathname, userId, createdAt]);

  const close = () => {
    remember(userId ? `${CLOSED_KEY}:${userId}` : CLOSED_KEY);
    setShow(false);
  };
  const firstName = (user?.name ?? previewName ?? "").trim().split(/s+/)[0];

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
            onClick={close}
            aria-label="Close"
            className="absolute top-2 right-2 rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
          <p className="inline-flex items-center gap-2 pr-6 font-display text-xl font-semibold">
            <PartyPopper className="size-5 text-gold-light" aria-hidden />
            {firstName ? `Welcome to launch day, ${firstName}!` : "RecipeNest is live!"}
          </p>
          <p className="mt-1 text-sm text-white/80">
            {firstName
              ? "Thanks for joining RecipeNest from day one. Enter this week's contest and the lucky draw before they close."
              : "Thanks for being here on launch day. New members get their first month of Premium free."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
            <Link href="/contests" onClick={close} className="rounded-full bg-metallic-gold px-3 py-1.5 text-[oklch(0.2_0.006_70)] hover:opacity-95">
              Weekly contest: ₹500 × 2
            </Link>
            <Link href="/lucky-draw" onClick={close} className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-white/20 hover:bg-white/15">
              Lucky draw: 5 winners
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

const COLORS = ["#e8b54a", "#c8962e", "#f2c76b", "#e07a2f", "#6b9e4f", "#ffffff"];

/** A light canvas confetti burst (about 4 s), no library. */
export function Confetti({ onDone }: { onDone: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return onDone();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const w = window.innerWidth;
    const count = w < 640 ? 90 : 160;
    const pieces = Array.from({ length: count }, (_, i) => {
      const fromLeft = i % 2 === 0;
      return {
        x: fromLeft ? -10 : w + 10,
        y: window.innerHeight * (0.55 + Math.random() * 0.25),
        vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 7),
        vy: -(9 + Math.random() * 8),
        size: 5 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 0.3,
        color: COLORS[i % COLORS.length],
      };
    });
    const started = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = now - started;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalAlpha = t > 3000 ? Math.max(0, 1 - (t - 3000) / 1000) : 1;
      for (const p of pieces) {
        p.vy += 0.28;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (t < 4000) frame = requestAnimationFrame(tick);
      else onDone();
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [onDone]);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 z-[200] size-full" />;
}

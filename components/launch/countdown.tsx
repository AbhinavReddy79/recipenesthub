"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PartyPopper, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// One shared once-a-second clock. The server renders placeholders ("--"),
// so the countdown never mismatches between server and browser.
function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}
const nowInSeconds = () => Math.floor(Date.now() / 1000);
const noTimeOnServer = () => null;

const UNITS = [
  { label: "Days", seconds: 86400, max: Infinity },
  { label: "Hours", seconds: 3600, max: 24 },
  { label: "Minutes", seconds: 60, max: 60 },
  { label: "Seconds", seconds: 1, max: 60 },
] as const;

const split = (left: number) => UNITS.map(({ seconds, max }) => Math.floor(left / seconds) % max);

/** One digit: the new one rolls in from above while the old one drops away. */
function Digit({ value, previous }: { value: string; previous: string }) {
  const changed = value !== previous;
  return (
    <span className="relative inline-block overflow-hidden px-[0.02em] [perspective:400px]">
      <span key={value} className={cn("block text-metallic-gold", changed && "countdown-digit-in")}>
        {value}
      </span>
      {changed && (
        <span key={`${previous}-${value}`} className="countdown-digit-out absolute inset-0 text-metallic-gold">
          {previous}
        </span>
      )}
    </span>
  );
}

export function Countdown({ launchAt }: { launchAt: number }) {
  const now = useSyncExternalStore(subscribe, nowInSeconds, noTimeOnServer);
  const left = now === null ? null : Math.max(0, Math.floor(launchAt / 1000) - now);
  const reachedZero = left === 0;
  const router = useRouter();
  const [live, setLive] = useState(false);

  // The owner opens the site with a button. Check every 30 seconds (every 10
  // once the countdown has reached zero) and take visitors in when it's live.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let cancelled = false;
    const check = () =>
      supabase.rpc("site_is_launched").then(({ data }) => {
        if (!cancelled && data === true) setLive(true);
      });
    void check();
    const id = window.setInterval(check, reachedZero ? 10_000 : 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [reachedZero]);

  useEffect(() => {
    if (!live) return;
    const id = window.setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 2500);
    return () => window.clearTimeout(id);
  }, [live, router]);

  if (reachedZero && !live) {
    return (
      <div className="grid justify-items-center gap-3" role="status">
        <Rocket className="size-12 animate-bounce-soft text-saffron" aria-hidden />
        <p className="font-display text-3xl font-semibold sm:text-4xl">Launching today!</p>
        <p className="text-white/75">We&apos;re putting the final touches on. This page opens by itself the moment we go live.</p>
      </div>
    );
  }

  if (live) {
    return (
      <div className="grid justify-items-center gap-4" role="status">
        <PartyPopper className="size-12 animate-pop text-saffron" aria-hidden />
        <p className="animate-rise font-display text-3xl font-semibold sm:text-4xl">We&apos;re live!</p>
        <Button asChild size="lg" className="rounded-full">
          <Link href="/">Enter RecipeNest</Link>
        </Button>
      </div>
    );
  }

  const values = split(left ?? 0);
  // What each tile showed a second ago, so the digits that changed can roll over.
  const previous = left === null ? values : split(left + 1);
  const parts = UNITS.map(({ label }, i) => ({ label, value: values[i], previous: previous[i] }));
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div>
      <ol className="grid grid-cols-4 gap-2 sm:gap-4" aria-hidden>
        {parts.map(({ label, value, previous: before }, i) => (
          <li
            key={label}
            style={{ animationDelay: `${i * 90}ms`, ["--sweep-delay" as string]: `${i * 0.35}s` }}
            className="countdown-tile relative grid animate-rise justify-items-center gap-1 overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] px-1 py-4 shadow-[inset_0_1px_0_oklch(1_0_0/0.12)] backdrop-blur-md sm:px-4 sm:py-6"
          >
            {left !== null && value !== before && <span key={value} aria-hidden className="countdown-tick absolute inset-0 rounded-2xl" />}
            <span className="font-display text-4xl leading-none font-semibold tabular-nums sm:text-6xl">
              {left === null ? (
                <span className="text-metallic-gold">--</span>
              ) : (
                [...pad(value)].map((digit, d) => <Digit key={d} value={digit} previous={pad(before)[d] ?? digit} />)
              )}
            </span>
            <span className="text-[0.625rem] font-bold tracking-[0.16em] text-white/70 uppercase sm:text-xs">{label}</span>
          </li>
        ))}
      </ol>
      {/* Screen readers get one calm sentence instead of a number changing every second. */}
      <p className="sr-only">
        {left === null ? "Loading the countdown." : `${parts[0].value} days and ${parts[1].value} hours until launch.`}
      </p>
    </div>
  );
}

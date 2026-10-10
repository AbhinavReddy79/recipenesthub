"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function Countdown({ launchAt }: { launchAt: number }) {
  const now = useSyncExternalStore(subscribe, nowInSeconds, noTimeOnServer);
  const left = now === null ? null : Math.max(0, Math.floor(launchAt / 1000) - now);
  const live = left === 0;
  const router = useRouter();

  // At launch the site opens by itself: head to the home page.
  useEffect(() => {
    if (!live) return;
    const id = window.setTimeout(() => router.replace("/"), 2500);
    return () => window.clearTimeout(id);
  }, [live, router]);

  if (live) {
    return (
      <div className="grid justify-items-center gap-4" role="status">
        <PartyPopper className="size-12 text-saffron" aria-hidden />
        <p className="font-display text-3xl font-semibold sm:text-4xl">We&apos;re live!</p>
        <Button asChild size="lg" className="rounded-full">
          <Link href="/">Enter RecipeNest</Link>
        </Button>
      </div>
    );
  }

  const parts = UNITS.map(({ label, seconds, max }) => ({ label, value: Math.floor((left ?? 0) / seconds) % max }));

  return (
    <div>
      <ol className="grid grid-cols-4 gap-2 sm:gap-4" aria-hidden>
        {parts.map(({ label, value }) => (
          <li
            key={label}
            className="grid justify-items-center gap-1 rounded-2xl border border-white/15 bg-white/[0.07] px-1 py-4 shadow-[inset_0_1px_0_oklch(1_0_0/0.12)] backdrop-blur-md sm:px-4 sm:py-6"
          >
            <span className="font-display text-4xl leading-none font-semibold text-metallic-gold tabular-nums sm:text-6xl">
              {left === null ? "--" : String(value).padStart(2, "0")}
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

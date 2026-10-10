"use client";

import { useSyncExternalStore } from "react";
import { Timer } from "lucide-react";
import { cn } from "@/lib/utils";

// The pick changes at midnight India time (see getRecipeOfTheDay). IST has no
// daylight saving, so the next midnight is a fixed offset away.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 30_000);
  return () => window.clearInterval(id);
}
// Whole minutes until the next pick, so the store only changes once a minute.
const minutesLeft = () => {
  const now = Date.now();
  const nextMidnight = Math.floor((now + IST_OFFSET_MS) / DAY_MS + 1) * DAY_MS - IST_OFFSET_MS;
  return Math.ceil((nextMidnight - now) / 60_000);
};
const notOnServer = () => null;

/** "New pick in 5h 12m": tells visitors the recipe of the day changes daily. */
export function NextPickCountdown({ className }: { className?: string }) {
  const minutes = useSyncExternalStore(subscribe, minutesLeft, notOnServer);
  const label =
    minutes === null
      ? "A new pick every day"
      : minutes >= 60
        ? `New pick in ${Math.floor(minutes / 60)}h ${minutes % 60}m`
        : `New pick in ${minutes}m`;

  return (
    <span className={cn("inline-flex items-center gap-1.5 tabular-nums", className)}>
      <Timer className="size-4" aria-hidden />
      {label}
    </span>
  );
}

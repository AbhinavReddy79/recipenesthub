import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Countdown } from "@/components/launch/countdown";
import { LaunchNotifyForm } from "@/components/launch/launch-notify-form";
import { Logo } from "@/components/layout/logo";
import { unsplash } from "@/lib/images";
import { LAUNCH_AT } from "@/lib/launch";

const launchDate = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kolkata",
}).format(LAUNCH_AT);

export const metadata: Metadata = {
  title: "Coming soon",
  description: `RecipeNest opens on ${launchDate}. Recipes from every Indian state and around the world, a meal planner and smart shopping lists.`,
};

export default function ComingSoonPage() {
  return (
    // Covers the whole screen (including the site's header and menus) until launch.
    <div className="dark fixed inset-0 z-[100] isolate overflow-x-hidden overflow-y-auto bg-ink text-white">
      <Image src={unsplash("1556910103-1c02745aae4d", 1800)} alt="" fill priority sizes="100vw" className="-z-20 animate-ken-burns object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-black/80 via-black/70 to-black/90" />

      <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-between gap-12 px-4 py-10 text-center sm:py-14">
        <Logo animated />

        <div className="grid w-full gap-8">
          <div className="grid gap-4">
            <p className="text-xs font-bold tracking-[0.2em] text-saffron uppercase">Coming soon</p>
            <h1 className="font-display text-4xl leading-[1.05] font-semibold text-balance text-shadow-lg sm:text-6xl">
              Something <span className="text-gradient-gold text-shadow-none">delicious</span> is almost ready
            </h1>
            <p className="mx-auto max-w-xl text-pretty text-white/80 sm:text-lg">
              Recipes from every Indian state and kitchens around the world, a meal planner and smart shopping lists, all in one
              place.
            </p>
          </div>

          <Countdown launchAt={LAUNCH_AT.getTime()} />

          <p className="inline-flex items-center justify-center gap-2 text-sm text-white/80">
            <CalendarDays className="size-4 text-saffron" aria-hidden />
            Opening {launchDate}
          </p>

          <LaunchNotifyForm />
        </div>

        <div className="grid gap-3 text-xs text-white/55">
          <p>
            Have early access?{" "}
            <Link href="/login" className="font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

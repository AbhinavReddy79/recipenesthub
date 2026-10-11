"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Crown, Trophy } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatRupees } from "@/lib/plans";
import { contestPhase, listContests, type Contest } from "@/lib/storage/contests";
import { usePlan } from "@/lib/storage/plan";

/** Home page banner for this week's contest (or the Premium plans when none is running). */
export function ContestTeaser() {
  const { user } = useCurrentUser();
  const plan = usePlan();
  const [contest, setContest] = useState<Contest | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listContests()
      .then((list) => {
        if (cancelled) return;
        const running = list.find((c) => contestPhase(c) === "open");
        const next = list.filter((c) => contestPhase(c) === "upcoming").sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
        setContest(running ?? next ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  const running = contest && contestPhase(contest) === "open";

  return (
    <section aria-labelledby="contest-teaser" className="container-page">
      <Link
        href={contest ? "/contests" : "/pricing"}
        className="group relative isolate flex flex-wrap items-center gap-5 overflow-hidden rounded-[1.75rem] bg-metallic-charcoal p-6 text-white shadow-lift ring-1 ring-saffron/40 transition-transform hover:-translate-y-0.5 sm:p-8"
      >
        <Trophy aria-hidden className="absolute -right-4 -bottom-6 -z-10 size-40 text-white/5" />
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-metallic-gold text-[oklch(0.2_0.006_70)] shadow-soft">
          {contest ? <Trophy className="size-7" aria-hidden /> : <Crown className="size-7" aria-hidden />}
        </span>
        <div className="grid min-w-0 flex-1 gap-1">
          <p className="text-xs font-bold tracking-[0.16em] text-gold-light uppercase">
            {contest ? (running ? "Weekly contest · live now" : "Weekly contest · starting soon") : "RecipeNest Premium"}
          </p>
          <h2 id="contest-teaser" className="text-balance font-display text-2xl font-semibold sm:text-3xl">
            {contest ? contest.title : "Unlimited recipes and weekly cash prizes"}
          </h2>
          <p className="text-sm text-white/75">
            {contest
              ? `${contest.prizeAmount > 0 ? `${formatRupees(contest.prizeAmount)} cash prize` : "A prize"} + a free month of Premium. ${
                  plan.premium ? "Enter your best recipe" : "Premium members enter, everyone votes"
                }.`
              : "Win Premium in the weekly lucky draw to publish without limits and compete every week."}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-metallic-gold px-4 py-2 text-sm font-semibold text-[oklch(0.2_0.006_70)]">
          {contest ? (running ? (plan.premium ? "Enter now" : "Vote now") : "See details") : "See plans"}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </Link>
    </section>
  );
}

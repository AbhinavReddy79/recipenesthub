"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { CalendarClock, Clover, Crown, PartyPopper, Users } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate } from "@/lib/format";
import { DRAW_PREMIUM_MONTHS, formatRupees } from "@/lib/plans";
import { useStore } from "@/lib/storage/core";
import { drawPhase, drawSummary, joinDraw, leaveDraw, listDraws, type DrawSummary, type LuckyDraw } from "@/lib/storage/draws";
import { usePlan } from "@/lib/storage/plan";
import { authStore } from "@/lib/storage/session";
import { cn } from "@/lib/utils";

// A clock that ticks every 30 seconds (time-left labels).
function subscribeMinute(onTick: () => void) {
  const id = window.setInterval(onTick, 30_000);
  return () => window.clearInterval(id);
}
const nowMinute = () => Math.floor(Date.now() / 60_000) * 60_000;
const noClockOnServer = () => 0;

function timeLeft(target: string, now: number): string {
  const minutes = Math.max(0, Math.ceil((Date.parse(target) - now) / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

/** This week's lucky draw (join / leave) and past winners. */
export function LuckyDrawView() {
  const { user } = useCurrentUser();
  const ready = useStore(authStore).ready;
  const [draws, setDraws] = useState<LuckyDraw[] | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    listDraws()
      .then((list) => !cancelled && setDraws(list))
      .catch(() => !cancelled && setDraws([]));
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  // Open draw first, else the next one coming up, else the most recent.
  const featured = useMemo(() => {
    if (!draws?.length) return null;
    const open = draws.find((d) => drawPhase(d) === "open");
    if (open) return open;
    const upcoming = draws.filter((d) => drawPhase(d) === "upcoming").sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return upcoming[0] ?? draws[0];
  }, [draws]);

  const past = draws?.filter((d) => d.id !== featured?.id && d.drawnAt) ?? [];

  if (!draws) return <ListSkeleton rows={3} />;

  if (!featured) {
    return (
      <EmptyState
        icon={Clover}
        title="The first lucky draw is coming soon"
        description={`Every week we draw winners for ${DRAW_PREMIUM_MONTHS} months of Premium. Check back soon!`}
      />
    );
  }

  return (
    <div className="grid gap-14">
      <DrawDetail key={featured.id} draw={featured} />

      {past.length > 0 && (
        <section aria-labelledby="past-draws" className="grid gap-5">
          <h2 id="past-draws" className="text-[1.75rem] font-semibold">
            Past winners
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((d) => (
              <PastDraw key={d.id} draw={d} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function DrawDetail({ draw }: { draw: LuckyDraw }) {
  const now = useSyncExternalStore(subscribeMinute, nowMinute, noClockOnServer);
  const phase = drawPhase(draw, now);
  const plan = usePlan();
  const [summary, setSummary] = useState<DrawSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    drawSummary(draw.id)
      .then(setSummary)
      .catch(() => setSummary({ entries: 0, joined: false, iWon: false, winners: [] }));
  }, [draw.id]);

  useEffect(() => {
    let cancelled = false;
    drawSummary(draw.id)
      .then((s) => !cancelled && setSummary(s))
      .catch(() => !cancelled && setSummary({ entries: 0, joined: false, iWon: false, winners: [] }));
    return () => {
      cancelled = true;
    };
  }, [draw.id]);

  const toggle = async () => {
    if (!summary) return;
    setBusy(true);
    const result = summary.joined ? await leaveDraw(draw.id) : await joinDraw(draw.id);
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    toast.success(summary.joined ? "You've left the draw." : "You're in the draw. Good luck!");
    reload();
  };

  return (
    <div className="grid gap-10">
      <section
        aria-labelledby="draw-title"
        className="relative isolate overflow-hidden rounded-[2rem] bg-metallic-charcoal p-6 text-white shadow-lift ring-2 ring-saffron/50 sm:p-10"
      >
        <Clover aria-hidden className="absolute -right-6 -bottom-8 -z-10 size-56 text-white/5" />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="grid gap-3">
            <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-gold-light uppercase">
              <CalendarClock className="size-4" aria-hidden />
              {phase === "open" && `Open now · closes in ${timeLeft(draw.endsAt, now)}`}
              {phase === "upcoming" && `Opens in ${timeLeft(draw.startsAt, now)}`}
              {phase === "closed" && "Closed · winners drawn soon"}
              {phase === "drawn" && "Winners drawn"}
            </p>
            <h2 id="draw-title" className="text-balance font-display text-4xl leading-tight font-semibold sm:text-5xl">
              {draw.title}
            </h2>
            <p className="max-w-2xl text-pretty text-white/80">
              Join with one click. When the draw closes, {draw.winnersCount} {draw.winnersCount === 1 ? "member is" : "members are"} picked at
              random. Free to enter, one entry per member.
            </p>
            <p className="inline-flex items-center gap-2 text-sm text-white/60">
              <Users className="size-4" aria-hidden />
              {formatDate(draw.startsAt)} – {formatDate(draw.endsAt)} · {summary?.entries ?? 0}{" "}
              {summary?.entries === 1 ? "member has" : "members have"} joined
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
            <p className="text-xs font-bold tracking-[0.16em] text-white/60 uppercase">Each winner gets</p>
            <p className="inline-flex items-center gap-2 font-display text-3xl font-semibold text-gold-light">
              <Crown className="size-7" aria-hidden />
              {DRAW_PREMIUM_MONTHS} months Premium
            </p>
            {draw.cashPrize > 0 && <p className="text-sm text-white/80">+ {formatRupees(draw.cashPrize)} cash</p>}

            {phase === "open" && summary && (
              <Button
                disabled={busy}
                onClick={toggle}
                variant={summary.joined ? "ghost" : "default"}
                className={cn(
                  summary.joined
                    ? "text-white ring-1 ring-white/20 hover:bg-white/10 hover:text-white"
                    : "bg-metallic-gold text-[oklch(0.2_0.006_70)] hover:opacity-95",
                )}
              >
                <Clover data-icon="inline-start" />
                {summary.joined ? "You're in · Leave the draw" : "Join the draw"}
              </Button>
            )}
            {phase !== "open" && summary?.joined && phase !== "drawn" && (
              <p className="rounded-xl bg-white/10 p-3 text-sm">You&apos;re in this draw. Good luck!</p>
            )}
            {plan.premium && phase === "open" && (
              <p className="text-xs text-white/60">Already Premium? Winning adds {DRAW_PREMIUM_MONTHS} more months.</p>
            )}
          </div>
        </div>
      </section>

      {phase === "drawn" && summary && (
        <section aria-labelledby="winners-heading" className="grid gap-5 rounded-3xl bg-warm-glow p-5 ring-1 ring-saffron/40 sm:p-6">
          <p id="winners-heading" className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-gold-ink uppercase">
            <PartyPopper className="size-4" aria-hidden />
            {summary.iWon ? "You won! Premium is now on your account." : "This week's winners"}
          </p>
          {summary.winners.length === 0 ? (
            <p className="text-muted-foreground">Nobody joined this draw.</p>
          ) : (
            <WinnerList winners={summary.winners} />
          )}
        </section>
      )}
    </div>
  );
}

function PastDraw({ draw }: { draw: LuckyDraw }) {
  const [summary, setSummary] = useState<DrawSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    drawSummary(draw.id)
      .then((s) => !cancelled && setSummary(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [draw.id]);

  return (
    <li className="grid content-start gap-3 rounded-2xl border bg-card p-4 shadow-soft">
      <span className="text-xs font-semibold text-muted-foreground">
        {formatDate(draw.startsAt)} – {formatDate(draw.endsAt)}
      </span>
      <span className="font-display text-lg font-semibold">{draw.title}</span>
      {summary?.iWon && <span className="justify-self-start rounded-full bg-accent px-2 text-xs font-semibold text-accent-foreground">You won</span>}
      {summary && (summary.winners.length ? <WinnerList winners={summary.winners} compact /> : <p className="text-sm text-muted-foreground">No entries</p>)}
    </li>
  );
}

function WinnerList({ winners, compact = false }: { winners: DrawSummary["winners"]; compact?: boolean }) {
  return (
    <ul className={cn("flex flex-wrap gap-3", compact && "gap-2")}>
      {winners.map((w) => (
        <li key={w.username} className="flex items-center gap-2 rounded-full bg-card py-1 pr-3 pl-1 text-sm shadow-soft ring-1 ring-border">
          <UserAvatar name={w.name} src={w.avatar} className="size-7" />
          <span className="font-semibold">{w.name}</span>
        </li>
      ))}
    </ul>
  );
}

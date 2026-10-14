"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarClock, Crown, Heart, Medal, PartyPopper, Plus, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useUserRecipes } from "@/hooks/use-user-recipes";
import { formatDate } from "@/lib/format";
import { formatRupees } from "@/lib/plans";
import {
  contestPhase,
  enterContest,
  listContests,
  listEntries,
  removeEntry,
  setVote,
  type Contest,
  type ContestEntry,
} from "@/lib/storage/contests";
import { useStore } from "@/lib/storage/core";
import { useAdminPowers } from "@/lib/storage/admin-powers";
import { usePlan } from "@/lib/storage/plan";
import { authStore } from "@/lib/storage/session";
import { cn } from "@/lib/utils";

// A clock that ticks once a minute (time-left labels).
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

/** This week's contest (enter, vote, leaderboard) and past winners. */
export function ContestView() {
  const { user } = useCurrentUser();
  const ready = useStore(authStore).ready;
  const [contests, setContests] = useState<Contest[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    let cancelled = false;
    listContests()
      .then((list) => !cancelled && setContests(list))
      .catch(() => !cancelled && setContests([]));
    return () => {
      cancelled = true;
    };
  }, [ready, user]);

  // Open contest first, else the next one coming up, else the most recent.
  const featured = useMemo(() => {
    if (!contests?.length) return null;
    const open = contests.find((c) => contestPhase(c) === "open");
    if (open) return open;
    const upcoming = contests.filter((c) => contestPhase(c) === "upcoming").sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return upcoming[0] ?? contests[0];
  }, [contests]);

  const shown = contests?.find((c) => c.id === selectedId) ?? featured;
  const past = contests?.filter((c) => c.id !== featured?.id && contestPhase(c) !== "upcoming") ?? [];

  if (!contests) return <ListSkeleton rows={4} />;

  if (!shown) {
    return (
      <EmptyState
        icon={Trophy}
        title="The first contest is coming soon"
        description="Every week we pick a theme and Premium cooks compete for a cash prize. Check back soon!"
        actions={
          <Button asChild>
            <Link href="/pricing">See Premium</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-14">
      <ContestDetail key={shown.id} contest={shown} />

      {past.length > 0 && (
        <section aria-labelledby="past-contests" className="grid gap-5">
          <h2 id="past-contests" className="text-[1.75rem] font-semibold">
            Past contests
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId(c.id);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className={cn(
                    "grid w-full gap-1 rounded-2xl border bg-card p-4 text-left shadow-soft transition-colors hover:border-primary/40",
                    c.id === shown.id && "border-primary ring-1 ring-primary/30",
                  )}
                >
                  <span className="text-xs font-semibold text-muted-foreground">
                    {formatDate(c.startsAt)} – {formatDate(c.endsAt)}
                  </span>
                  <span className="font-display text-lg font-semibold">{c.title}</span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Trophy className="size-4 text-gold-ink" aria-hidden />
                    {c.announcedAt ? (c.winnerEntryId ? (c.runnerUpEntryId ? "Winners announced" : "Winner announced") : "No entries") : "Results coming soon"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ContestDetail({ contest }: { contest: Contest }) {
  const { user } = useCurrentUser();
  // Removing entries needs the "Manage contests" admin power.
  const canManage = useAdminPowers().contests;
  const plan = usePlan();
  const { myPublished } = useUserRecipes();
  const now = useSyncExternalStore(subscribeMinute, nowMinute, noClockOnServer);
  const phase = contestPhase(contest, now);
  const [entries, setEntries] = useState<ContestEntry[] | null>(null);
  const [entering, setEntering] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(() => {
    listEntries(contest.id)
      .then(setEntries)
      .catch(() => setEntries([]));
  }, [contest.id]);

  useEffect(() => {
    let cancelled = false;
    listEntries(contest.id)
      .then((list) => !cancelled && setEntries(list))
      .catch(() => !cancelled && setEntries([]));
    return () => {
      cancelled = true;
    };
  }, [contest.id]);

  const myEntry = entries?.find((e) => e.userId === user?.id) ?? null;
  const winner = entries?.find((e) => e.id === contest.winnerEntryId) ?? null;
  const runnerUp = entries?.find((e) => e.id === contest.runnerUpEntryId) ?? null;
  const twoWinners = contest.winnerCount > 1;
  const enteredRecipeIds = new Set(entries?.map((e) => e.recipeId));
  const eligible = myPublished.filter((r) => !enteredRecipeIds.has(r.id));

  const vote = async (entry: ContestEntry) => {
    const next = !entry.votedByMe;
    // Optimistic: update straight away, undo if it fails.
    setEntries((list) => list?.map((e) => (e.id === entry.id ? { ...e, votedByMe: next, votes: e.votes + (next ? 1 : -1) } : e)) ?? null);
    const result = await setVote(entry.id, next);
    if (!result.ok) {
      toast.error(result.error);
      reload();
    }
  };

  const enter = async (recipeId: string) => {
    setBusy(true);
    const result = await enterContest(contest.id, recipeId);
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    toast.success("You're in! Share your recipe so friends can vote.");
    setEntering(false);
    reload();
  };

  const withdraw = async (entry: ContestEntry, asAdmin = false) => {
    const result = await removeEntry(entry.id);
    if (!result.ok) return toast.error(result.error);
    toast.success(asAdmin ? "Entry removed." : "Your entry was withdrawn.");
    reload();
  };

  const ranked = [...(entries ?? [])].sort((a, b) => b.votes - a.votes || a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="grid gap-10">
      {/* Contest hero */}
      <section
        aria-labelledby="contest-title"
        className="relative isolate overflow-hidden rounded-[2rem] bg-metallic-charcoal p-6 text-white shadow-lift ring-2 ring-saffron/50 sm:p-10"
      >
        <Trophy aria-hidden className="absolute -right-6 -bottom-8 -z-10 size-56 text-white/5" />
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="grid gap-3">
            <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-gold-light uppercase">
              <CalendarClock className="size-4" aria-hidden />
              {phase === "open" && `This week's theme · ends in ${timeLeft(contest.endsAt, now)}`}
              {phase === "upcoming" && `Next theme · starts in ${timeLeft(contest.startsAt, now)}`}
              {phase === "judging" && "Voting closed · results coming soon"}
              {phase === "announced" && "Results are in"}
            </p>
            <h2 id="contest-title" className="text-balance font-display text-4xl leading-tight font-semibold sm:text-5xl">
              {contest.title}
            </h2>
            {contest.description && <p className="max-w-2xl text-pretty text-white/80">{contest.description}</p>}
            <p className="text-sm text-white/60">
              {formatDate(contest.startsAt)} – {formatDate(contest.endsAt)} · {entries?.length ?? 0}{" "}
              {entries?.length === 1 ? "entry" : "entries"}
            </p>
          </div>

          <div className="grid gap-3 rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10">
            <p className="text-xs font-bold tracking-[0.16em] text-white/60 uppercase">{twoWinners ? "Prize · 2 winners" : "Prize"}</p>
            <p className="font-display text-3xl font-semibold text-gold-light">
              {contest.prizeAmount > 0 ? `${formatRupees(contest.prizeAmount)} cash${twoWinners ? " each" : ""}` : "Bragging rights"}
            </p>
            <p className="inline-flex items-center gap-1.5 text-sm text-white/80">
              <Crown className="size-4 text-gold-light" aria-hidden />+ 1 month of Premium free{twoWinners ? " each" : ""}
            </p>
            {twoWinners && <p className="text-xs text-white/60">The top 2 recipes by votes both win.</p>}

            {phase === "open" &&
              (myEntry ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/10 p-3 text-sm">
                  <span>
                    Your entry: <strong>{myEntry.recipeTitle}</strong>
                  </span>
                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => withdraw(myEntry)}>
                    Withdraw
                  </Button>
                </div>
              ) : plan.premium ? (
                <Button className="bg-metallic-gold text-[oklch(0.2_0.006_70)] hover:opacity-95" onClick={() => setEntering(true)}>
                  <Plus data-icon="inline-start" />
                  Enter a recipe
                </Button>
              ) : (
                <Button asChild className="bg-metallic-gold text-[oklch(0.2_0.006_70)] hover:opacity-95">
                  <Link href="/lucky-draw">
                    <Crown data-icon="inline-start" />
                    Win Premium to enter
                  </Link>
                </Button>
              ))}
          </div>
        </div>
      </section>

      {/* Winners */}
      {phase === "announced" &&
        [winner, runnerUp].map(
          (entry, i) =>
            entry && (
              <section
                key={entry.id}
                aria-label={i === 0 ? (runnerUp ? "First place" : "Weekly champion") : "Second place"}
                className="flex flex-wrap items-center gap-5 rounded-3xl bg-warm-glow p-5 ring-1 ring-saffron/40 sm:p-6"
              >
                <span className="relative size-24 shrink-0 overflow-hidden rounded-2xl ring-4 ring-saffron/60">
                  <Image src={entry.recipeImage} alt="" fill sizes="96px" className="object-cover" />
                </span>
                <div className="grid gap-1">
                  <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-gold-ink uppercase">
                    <PartyPopper className="size-4" aria-hidden />
                    {i === 0 ? (runnerUp ? "Weekly champion · 1st place" : "Weekly champion") : "Winner · 2nd place"}
                  </p>
                  <Link href={`/recipes/${entry.recipeSlug}`} className="font-display text-2xl font-semibold hover:text-primary">
                    {entry.recipeTitle}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    by {entry.authorName} · {entry.votes} {entry.votes === 1 ? "vote" : "votes"}
                  </p>
                </div>
              </section>
            ),
        )}

      {/* Entries */}
      <section aria-labelledby="entries-heading" className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="entries-heading" className="text-[1.75rem] font-semibold">
            {phase === "open" ? "Vote for your favourites" : "Entries"}
          </h2>
          {phase === "open" && <p className="text-sm text-muted-foreground">Every member can vote once per entry.</p>}
        </div>

        {!entries ? (
          <ListSkeleton rows={3} />
        ) : ranked.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            {phase === "upcoming" ? "Entries open when the contest starts." : "No entries yet. Be the first!"}
          </p>
        ) : (
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ranked.map((entry, index) => {
              const mine = entry.userId === user?.id;
              const isWinner = entry.id === contest.winnerEntryId || entry.id === contest.runnerUpEntryId;
              return (
                <li
                  key={entry.id}
                  className={cn(
                    "group relative flex flex-col overflow-hidden rounded-[1.375rem] bg-card shadow-card ring-1 ring-border",
                    isWinner && "ring-2 ring-saffron",
                  )}
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={entry.recipeImage}
                      alt={entry.recipeTitle}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-xs font-bold text-white">
                      {index < 3 && <Medal className="size-3.5 text-gold-light" aria-hidden />}#{index + 1}
                    </span>
                    {isWinner && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-metallic-gold px-2.5 py-1 text-xs font-bold text-[oklch(0.2_0.006_70)]">
                        <Trophy className="size-3.5" aria-hidden />
                        {contest.runnerUpEntryId ? (entry.id === contest.winnerEntryId ? "1st" : "2nd") : "Winner"}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <Link href={`/recipes/${entry.recipeSlug}`} className="font-display text-lg leading-snug font-semibold hover:text-primary">
                      {entry.recipeTitle}
                    </Link>
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <UserAvatar name={entry.authorName} src={entry.authorAvatar} className="size-6" />
                      {entry.authorName}
                      {mine && <span className="rounded-full bg-accent px-2 text-xs font-semibold text-accent-foreground">You</span>}
                    </span>
                    <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
                      <span className="text-sm font-semibold tabular-nums">
                        {entry.votes} {entry.votes === 1 ? "vote" : "votes"}
                      </span>
                      <div className="flex items-center gap-1">
                        {canManage && phase !== "announced" && (
                          <Button size="icon-sm" variant="ghost" aria-label={`Remove ${entry.recipeTitle}`} onClick={() => withdraw(entry, true)}>
                            <X />
                          </Button>
                        )}
                        {phase === "open" && !mine && (
                          <Button
                            size="sm"
                            variant={entry.votedByMe ? "default" : "outline"}
                            aria-pressed={entry.votedByMe}
                            onClick={() => vote(entry)}
                          >
                            <Heart data-icon="inline-start" className={cn(entry.votedByMe && "fill-current")} />
                            {entry.votedByMe ? "Voted" : "Vote"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {/* Enter dialog */}
      <Dialog open={entering} onOpenChange={setEntering}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Enter “{contest.title}”</DialogTitle>
            <DialogDescription>Choose one of your published recipes that fits this week&apos;s theme. You can enter once per contest.</DialogDescription>
          </DialogHeader>
          {eligible.length === 0 ? (
            <div className="grid gap-3 rounded-xl bg-muted p-4 text-sm">
              <p>You don&apos;t have a published recipe to enter yet.</p>
              <Button asChild size="sm" className="justify-self-start">
                <Link href="/recipes/create">Create a recipe</Link>
              </Button>
            </div>
          ) : (
            <ul className="grid max-h-80 gap-2 overflow-y-auto">
              {eligible.map((recipe) => (
                <li key={recipe.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => enter(recipe.id)}
                    className="flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors hover:border-primary/50 hover:bg-muted disabled:opacity-60"
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {recipe.image && <Image src={recipe.image} alt="" fill sizes="56px" className="object-cover" />}
                    </span>
                    <span className="grid min-w-0">
                      <span className="truncate font-semibold">{recipe.title}</span>
                      <span className="text-xs text-muted-foreground">Published {formatDate(recipe.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEntering(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

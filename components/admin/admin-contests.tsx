"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Plus, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate } from "@/lib/format";
import { formatRupees } from "@/lib/plans";
import {
  announceWinner,
  contestPhase,
  createContest,
  deleteContest,
  listContests,
  listEntries,
  setPrizePaid,
  type Contest,
  type ContestEntry,
  type ContestPhase,
} from "@/lib/storage/contests";
import { emailWinnersToOwner } from "@/lib/storage/waitlist";

const PHASE_LABEL: Record<ContestPhase, string> = {
  upcoming: "Upcoming",
  open: "Running",
  judging: "Ended · announce winner",
  announced: "Announced",
};

/** "YYYY-MM-DDTHH:mm" in the browser's time zone, for <input type="datetime-local">. */
function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Next Monday 00:00 to the following Sunday 23:59 (local time). */
function nextWeek() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() + (((8 - start.getDay()) % 7) || 7));
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 0, 0);
  return { start: toLocalInput(start), end: toLocalInput(end) };
}

/** Admin: create weekly contests, announce winners and record cash prize payouts. */
export function AdminContests() {
  const { isAdmin } = useCurrentUser();
  const [contests, setContests] = useState<Contest[] | null>(null);
  const [winners, setWinners] = useState<Record<string, ContestEntry | undefined>>({});
  const [runnersUp, setRunnersUp] = useState<Record<string, ContestEntry | undefined>>({});
  const [entryCounts, setEntryCounts] = useState<Record<string, number>>({});
  const week = nextWeek();
  const [form, setForm] = useState({ title: "", description: "", startsAt: week.start, endsAt: week.end, prize: "500", winnerCount: "2" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const list = await listContests().catch(() => [] as Contest[]);
    setContests(list);
    // Entry counts and winners for the list (a handful of contests).
    const details = await Promise.all(list.map((c) => listEntries(c.id).catch(() => [] as ContestEntry[])));
    setEntryCounts(Object.fromEntries(list.map((c, i) => [c.id, details[i].length])));
    setWinners(Object.fromEntries(list.map((c, i) => [c.id, details[i].find((e) => e.id === c.winnerEntryId)])));
    setRunnersUp(Object.fromEntries(list.map((c, i) => [c.id, details[i].find((e) => e.id === c.runnerUpEntryId)])));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    void (async () => {
      const list = await listContests().catch(() => [] as Contest[]);
      if (cancelled) return;
      setContests(list);
      const details = await Promise.all(list.map((c) => listEntries(c.id).catch(() => [] as ContestEntry[])));
      if (cancelled) return;
      setEntryCounts(Object.fromEntries(list.map((c, i) => [c.id, details[i].length])));
      setWinners(Object.fromEntries(list.map((c, i) => [c.id, details[i].find((e) => e.id === c.winnerEntryId)])));
      setRunnersUp(Object.fromEntries(list.map((c, i) => [c.id, details[i].find((e) => e.id === c.runnerUpEntryId)])));
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const startsAt = new Date(form.startsAt);
    const endsAt = new Date(form.endsAt);
    const prize = Number(form.prize);
    const winnerCount = Number(form.winnerCount);
    if (form.title.trim().length < 3) return toast.error("Give the contest a theme (at least 3 characters).");
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return toast.error("The contest must end after it starts.");
    }
    if (!Number.isInteger(prize) || prize < 0) return toast.error("Enter the cash prize in whole rupees.");
    setSaving(true);
    const result = await createContest({
      title: form.title.trim(),
      description: form.description.trim(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      prizeAmount: prize,
      winnerCount,
    });
    setSaving(false);
    if (!result.ok) return toast.error(result.error);
    toast.success("Contest created.");
    setForm((f) => ({ ...f, title: "", description: "" }));
    void load();
  };

  const announce = async (contest: Contest) => {
    const result = await announceWinner(contest.id);
    if (!result.ok) return toast.error(result.error);
    toast.success(
      result.value
        ? contest.winnerCount > 1
          ? "Winners announced. Each got a free Premium month."
          : "Winner announced and given a free Premium month."
        : "Contest closed with no entries.",
    );
    if (result.value) {
      void emailWinnersToOwner("contest", contest.id).then((sent) =>
        sent
          ? toast.success("Winners' details emailed to the owner.")
          : toast.error("We couldn't email the winners' details. Their emails are in Admin > Users."),
      );
    }
    void load();
  };

  const togglePaid = async (contest: Contest, paid: boolean) => {
    const result = await setPrizePaid(contest.id, paid);
    if (!result.ok) return toast.error(result.error);
    setContests((list) => list?.map((c) => (c.id === contest.id ? { ...c, prizePaid: paid } : c)) ?? null);
  };

  const remove = async (contest: Contest) => {
    if (!window.confirm(`Delete “${contest.title}” and all its entries and votes?`)) return;
    const result = await deleteContest(contest.id);
    if (!result.ok) return toast.error(result.error);
    toast.success("Contest deleted.");
    void load();
  };

  return (
    <div className="grid gap-10">
      <form onSubmit={create} className="grid gap-5 rounded-2xl border bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-xl font-semibold">New weekly contest</h2>
        <div className="grid gap-2">
          <Label htmlFor="contest-title">Theme</Label>
          <Input
            id="contest-title"
            value={form.title}
            maxLength={80}
            placeholder="e.g. Monsoon snacks"
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="contest-description">Rules or description (optional)</Label>
          <Textarea
            id="contest-description"
            value={form.description}
            maxLength={600}
            rows={3}
            placeholder="What should entries be about? Any rules?"
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="contest-start">Starts</Label>
            <Input id="contest-start" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contest-end">Ends</Label>
            <Input id="contest-end" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contest-winners">Winners</Label>
            <Select value={form.winnerCount} onValueChange={(winnerCount) => setForm({ ...form, winnerCount })}>
              <SelectTrigger id="contest-winners" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 winner</SelectItem>
                <SelectItem value="2">2 winners</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contest-prize">Cash prize per winner (₹)</Label>
            <Input
              id="contest-prize"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={form.prize}
              onChange={(e) => setForm({ ...form, prize: e.target.value })}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Votes decide: the most-voted recipe wins, and with 2 winners the second most-voted also wins. Each winner gets the cash prize and a free month of Premium automatically. You pay the cash prizes yourself, then tick “Prize paid”.
        </p>
        <Button type="submit" className="justify-self-start" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          Create contest
        </Button>
      </form>

      <section aria-labelledby="all-contests" className="grid gap-4">
        <h2 id="all-contests" className="text-xl font-semibold">
          All contests
        </h2>
        {!contests ? (
          <ListSkeleton rows={3} />
        ) : contests.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">No contests yet. Create the first one above.</p>
        ) : (
          <ul className="grid gap-3">
            {contests.map((contest) => {
              const phase = contestPhase(contest);
              const winner = winners[contest.id];
              const runnerUp = runnersUp[contest.id];
              return (
                <li key={contest.id} className="grid gap-3 rounded-2xl border bg-card p-4 shadow-soft sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="grid gap-1">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {PHASE_LABEL[phase]} · {formatDate(contest.startsAt)} – {formatDate(contest.endsAt)} · {entryCounts[contest.id] ?? 0} entries
                    </span>
                    <span className="font-display text-lg font-semibold">{contest.title}</span>
                    <span className="text-sm text-muted-foreground">
                      Prize {formatRupees(contest.prizeAmount)}
                      {contest.winnerCount > 1 ? ` each to ${contest.winnerCount} winners` : ""} + 1 month Premium
                      {winner && <WinnerLine label={runnerUp ? "1st" : "Winner"} entry={winner} />}
                      {runnerUp && <WinnerLine label="2nd" entry={runnerUp} />}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    {phase === "judging" && (
                      <Button size="sm" onClick={() => announce(contest)}>
                        <Trophy data-icon="inline-start" />
                        Announce winner
                      </Button>
                    )}
                    {phase === "announced" && winner && contest.prizeAmount > 0 && (
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <Switch checked={contest.prizePaid} onCheckedChange={(paid) => togglePaid(contest, paid)} />
                        Prize paid
                      </label>
                    )}
                    <Button size="icon-sm" variant="ghost" aria-label={`Delete ${contest.title}`} onClick={() => remove(contest)}>
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function WinnerLine({ label, entry }: { label: string; entry: ContestEntry }) {
  return (
    <>
      {" · "}
      {label}:{" "}
      <Link href={`/recipes/${entry.recipeSlug}`} className="font-semibold text-foreground hover:text-primary">
        {entry.recipeTitle}
      </Link>{" "}
      by {entry.authorName} (@{entry.authorUsername})
    </>
  );
}

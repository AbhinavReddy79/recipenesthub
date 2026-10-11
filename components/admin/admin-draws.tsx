"use client";

import { useCallback, useEffect, useState } from "react";
import { Clover, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/format";
import { DRAW_PREMIUM_MONTHS, formatRupees } from "@/lib/plans";
import { useAdminPowers } from "@/lib/storage/admin-powers";
import {
  createDraw,
  deleteDraw,
  drawPhase,
  drawSummary,
  drawWinners,
  listDraws,
  setDrawPrizePaid,
  winnerDetails,
  type DrawPhase,
  type LuckyDraw,
  type WinnerDetails,
} from "@/lib/storage/draws";

const PHASE_LABEL: Record<DrawPhase, string> = {
  upcoming: "Upcoming",
  open: "Open",
  closed: "Closed · draw the winners",
  drawn: "Winners drawn",
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

interface DrawInfo {
  entries: number;
  winners: WinnerDetails[];
}

/** Admin: create weekly lucky draws, draw random winners and record cash prize payouts. */
export function AdminDraws() {
  const powers = useAdminPowers();
  const [draws, setDraws] = useState<LuckyDraw[] | null>(null);
  const [info, setInfo] = useState<Record<string, DrawInfo>>({});
  const week = nextWeek();
  const [form, setForm] = useState({ title: "Weekly lucky draw", startsAt: week.start, endsAt: week.end, winners: "3", prize: "500" });
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const list = await listDraws().catch(() => [] as LuckyDraw[]);
    const details = await Promise.all(
      list.map(async (d) => ({
        entries: (await drawSummary(d.id).catch(() => null))?.entries ?? 0,
        winners: d.drawnAt ? await winnerDetails(d.id).catch(() => [] as WinnerDetails[]) : [],
      })),
    );
    return { list, info: Object.fromEntries(list.map((d, i) => [d.id, details[i]])) };
  }, []);

  const load = useCallback(async () => {
    const result = await fetchAll();
    setDraws(result.list);
    setInfo(result.info);
  }, [fetchAll]);

  useEffect(() => {
    if (!powers.contests) return;
    let cancelled = false;
    void fetchAll().then((result) => {
      if (cancelled) return;
      setDraws(result.list);
      setInfo(result.info);
    });
    return () => {
      cancelled = true;
    };
  }, [powers.contests, fetchAll]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    const startsAt = new Date(form.startsAt);
    const endsAt = new Date(form.endsAt);
    const winners = Number(form.winners);
    const prize = Number(form.prize);
    if (form.title.trim().length < 3) return toast.error("Give the draw a name (at least 3 characters).");
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return toast.error("The draw must close after it opens.");
    }
    if (!Number.isInteger(winners) || winners < 1 || winners > 50) return toast.error("Choose between 1 and 50 winners.");
    if (!Number.isInteger(prize) || prize < 0) return toast.error("Enter the cash prize in whole rupees.");
    setSaving(true);
    const result = await createDraw({
      title: form.title.trim(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      winnersCount: winners,
      cashPrize: prize,
    });
    setSaving(false);
    if (!result.ok) return toast.error(result.error);
    toast.success("Lucky draw created.");
    void load();
  };

  const draw = async (d: LuckyDraw) => {
    if (!window.confirm(`Draw ${d.winnersCount} random ${d.winnersCount === 1 ? "winner" : "winners"} for “${d.title}”? This can't be undone.`)) return;
    setDrawing(d.id);
    const result = await drawWinners(d.id);
    setDrawing(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(
      result.value
        ? `${result.value} ${result.value === 1 ? "winner" : "winners"} drawn and given ${DRAW_PREMIUM_MONTHS} months of Premium.`
        : "Draw closed. Nobody had joined.",
    );
    void load();
  };

  const togglePaid = async (d: LuckyDraw, winner: WinnerDetails, paid: boolean) => {
    const ok = await setDrawPrizePaid(d.id, winner.userId, paid);
    if (!ok) return toast.error("Only the owner can mark prizes as paid.");
    setInfo((all) => ({
      ...all,
      [d.id]: { ...all[d.id], winners: all[d.id].winners.map((w) => (w.userId === winner.userId ? { ...w, prizePaid: paid } : w)) },
    }));
  };

  const remove = async (d: LuckyDraw) => {
    if (!window.confirm(`Delete “${d.title}” and all its entries?`)) return;
    const result = await deleteDraw(d.id);
    if (!result.ok) return toast.error(result.error);
    toast.success("Lucky draw deleted.");
    void load();
  };

  return (
    <div className="grid gap-10">
      <form onSubmit={create} className="grid gap-5 rounded-2xl border bg-card p-5 shadow-card sm:p-6">
        <h2 className="text-xl font-semibold">New lucky draw</h2>
        <div className="grid gap-2">
          <Label htmlFor="draw-title">Name</Label>
          <Input id="draw-title" value={form.title} maxLength={80} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="grid gap-2">
            <Label htmlFor="draw-start">Opens</Label>
            <Input id="draw-start" type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="draw-end">Closes</Label>
            <Input id="draw-end" type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="draw-winners">Number of winners</Label>
            <Input
              id="draw-winners"
              type="number"
              inputMode="numeric"
              min={1}
              max={50}
              step={1}
              value={form.winners}
              onChange={(e) => setForm({ ...form, winners: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="draw-prize">Cash prize per winner (₹)</Label>
            <Input
              id="draw-prize"
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
          Each winner automatically gets {DRAW_PREMIUM_MONTHS} months of Premium. You pay the cash prize yourself, then the owner ticks “Prize paid”.
        </p>
        <Button type="submit" className="justify-self-start" disabled={saving}>
          {saving ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
          Create lucky draw
        </Button>
      </form>

      <section aria-labelledby="all-draws" className="grid gap-4">
        <h2 id="all-draws" className="text-xl font-semibold">
          All lucky draws
        </h2>
        {!draws ? (
          <ListSkeleton rows={3} />
        ) : draws.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">No lucky draws yet. Create the first one above.</p>
        ) : (
          <ul className="grid gap-3">
            {draws.map((d) => {
              const phase = drawPhase(d);
              const details = info[d.id];
              return (
                <li key={d.id} className="grid gap-3 rounded-2xl border bg-card p-4 shadow-soft">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div className="grid gap-1">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {PHASE_LABEL[phase]} · {formatDate(d.startsAt)} – {formatDate(d.endsAt)} · {details?.entries ?? 0} joined
                      </span>
                      <span className="font-display text-lg font-semibold">{d.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {d.winnersCount} {d.winnersCount === 1 ? "winner" : "winners"} · {DRAW_PREMIUM_MONTHS} months Premium
                        {d.cashPrize > 0 && ` + ${formatRupees(d.cashPrize)} each`}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {phase === "closed" && (
                        <Button size="sm" disabled={drawing === d.id} onClick={() => draw(d)}>
                          {drawing === d.id ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Clover data-icon="inline-start" />}
                          Draw winners
                        </Button>
                      )}
                      <Button size="icon-sm" variant="ghost" aria-label={`Delete ${d.title}`} onClick={() => remove(d)}>
                        <Trash2 />
                      </Button>
                    </div>
                  </div>

                  {phase === "drawn" && details && (
                    <ul className="grid gap-2 border-t pt-3">
                      {details.winners.length === 0 && <li className="text-sm text-muted-foreground">Nobody joined this draw.</li>}
                      {details.winners.map((w) => (
                        <li key={w.userId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span>
                            <strong>{w.name}</strong> (@{w.username}) · <span className="text-muted-foreground">{w.email}</span>
                          </span>
                          {d.cashPrize > 0 &&
                            (powers.owner ? (
                              <label className="flex items-center gap-2 font-medium">
                                <Switch checked={w.prizePaid} onCheckedChange={(paid) => togglePaid(d, w, paid)} />
                                Prize paid
                              </label>
                            ) : (
                              <span className="text-muted-foreground">{w.prizePaid ? "Prize paid" : "Prize not paid yet"}</span>
                            ))}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

import { BUCKETS } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";
import { refreshPlan } from "./plan";
import { safeImageUrl, userContext } from "./remote";

type DrawRow = Database["public"]["Tables"]["lucky_draws"]["Row"];

export interface LuckyDraw {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  winnersCount: number;
  cashPrize: number;
  drawnAt: string | null;
}

export interface DrawWinner {
  name: string;
  username: string;
  avatar: string;
}

export interface DrawSummary {
  entries: number;
  joined: boolean;
  iWon: boolean;
  winners: DrawWinner[];
}

export type DrawPhase = "upcoming" | "open" | "closed" | "drawn";

export function drawPhase(draw: LuckyDraw, now = Date.now()): DrawPhase {
  if (draw.drawnAt) return "drawn";
  if (now < Date.parse(draw.startsAt)) return "upcoming";
  if (now < Date.parse(draw.endsAt)) return "open";
  return "closed";
}

const toDraw = (row: DrawRow): LuckyDraw => ({
  id: row.id,
  title: row.title,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  winnersCount: row.winners_count,
  cashPrize: row.cash_prize,
  drawnAt: row.drawn_at,
});

type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };

function failure(error: { code?: string; message?: string } | null, fallback: string): { ok: false; error: string } {
  if (error?.code === "23505") return { ok: false, error: "You've already joined this draw." };
  if (error?.code === "42501") return { ok: false, error: "That isn't allowed right now. The draw may have closed." };
  if (error?.code === "54000") return { ok: false, error: "You're doing that too often. Please try again later." };
  if (error?.code === "22023" && error.message) return { ok: false, error: error.message };
  return { ok: false, error: fallback };
}

/** Newest first. */
export async function listDraws(): Promise<LuckyDraw[]> {
  const ctx = userContext();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase.from("lucky_draws").select("*").order("starts_at", { ascending: false }).limit(30);
  if (error) throw error;
  return (data ?? []).map(toDraw);
}

export async function drawSummary(drawId: string): Promise<DrawSummary> {
  const ctx = userContext();
  if (!ctx) return { entries: 0, joined: false, iWon: false, winners: [] };
  const { data, error } = await ctx.supabase.rpc("lucky_draw_summary", { p_draw: drawId }).maybeSingle();
  if (error) throw error;
  const winners = ((data?.winners ?? []) as { name: string; username: string; avatar: string }[]).map((w) => ({
    ...w,
    avatar: safeImageUrl(w.avatar, BUCKETS.avatars),
  }));
  return { entries: data?.entries ?? 0, joined: data?.joined ?? false, iWon: data?.i_won ?? false, winners };
}

export async function joinDraw(drawId: string): Promise<Result> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { error } = await ctx.supabase.from("lucky_draw_entries").insert({ draw_id: drawId, user_id: ctx.userId });
  return error ? failure(error, "We couldn't add you to the draw. Please try again.") : { ok: true, value: undefined };
}

export async function leaveDraw(drawId: string): Promise<Result> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { error } = await ctx.supabase.from("lucky_draw_entries").delete().eq("draw_id", drawId).eq("user_id", ctx.userId);
  return error ? failure(error, "We couldn't take you out of the draw.") : { ok: true, value: undefined };
}

/* ---------- Admin ---------- */

export interface DrawInput {
  title: string;
  startsAt: string;
  endsAt: string;
  winnersCount: number;
  cashPrize: number;
}

export async function createDraw(input: DrawInput): Promise<Result> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { error } = await ctx.supabase.from("lucky_draws").insert({
    title: input.title,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    winners_count: input.winnersCount,
    cash_prize: input.cashPrize,
  });
  return error ? failure(error, "We couldn't create the draw. Check the dates and try again.") : { ok: true, value: undefined };
}

export async function deleteDraw(drawId: string): Promise<Result> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { error } = await ctx.supabase.from("lucky_draws").delete().eq("id", drawId);
  return error ? failure(error, "We couldn't delete the draw.") : { ok: true, value: undefined };
}

/** Picks random winners (3 months of Premium each). Returns how many won. */
export async function drawWinners(drawId: string): Promise<Result<number>> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { data, error } = await ctx.supabase.rpc("admin_draw_winners", { p_draw: drawId });
  if (error) return failure(error, "We couldn't draw the winners.");
  void refreshPlan().catch(() => {});
  return { ok: true, value: data ?? 0 };
}

export interface WinnerDetails {
  userId: string;
  name: string;
  username: string;
  email: string;
  prizePaid: boolean;
}

export async function winnerDetails(drawId: string): Promise<WinnerDetails[]> {
  const ctx = userContext();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase.rpc("admin_draw_winner_details", { p_draw: drawId });
  if (error) throw error;
  return (data ?? []).map((w) => ({ userId: w.user_id, name: w.name, username: w.username, email: w.email, prizePaid: w.prize_paid }));
}

/** Owner only (enforced by the database). */
export async function setDrawPrizePaid(drawId: string, userId: string, paid: boolean): Promise<boolean> {
  const ctx = userContext();
  if (!ctx) return false;
  const { error } = await ctx.supabase.rpc("owner_set_draw_prize_paid", { p_draw: drawId, p_user: userId, paid });
  return !error;
}

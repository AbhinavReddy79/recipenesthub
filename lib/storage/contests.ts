import { FALLBACK_RECIPE_IMAGE } from "@/lib/images";
import { BUCKETS } from "@/lib/supabase/env";
import type { Database } from "@/lib/supabase/database.types";
import { safeImageUrl, userContext } from "./remote";

type ContestRow = Database["public"]["Tables"]["contests"]["Row"];
type EntryRow = Database["public"]["Functions"]["contest_entries_with_votes"]["Returns"][number];

export interface Contest {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  /** Cash prize for each winner. */
  prizeAmount: number;
  /** 1 or 2: the most-voted entry wins; with 2 the runner-up also wins. */
  winnerCount: number;
  winnerEntryId: string | null;
  runnerUpEntryId: string | null;
  announcedAt: string | null;
  prizePaid: boolean;
}

export interface ContestEntry {
  id: string;
  recipeId: string;
  recipeSlug: string;
  recipeTitle: string;
  recipeImage: string;
  userId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  votes: number;
  votedByMe: boolean;
  createdAt: string;
}

export type ContestPhase = "upcoming" | "open" | "judging" | "announced";

export function contestPhase(contest: Contest, now = Date.now()): ContestPhase {
  if (contest.announcedAt) return "announced";
  if (now < Date.parse(contest.startsAt)) return "upcoming";
  if (now < Date.parse(contest.endsAt)) return "open";
  return "judging";
}

const toContest = (row: ContestRow): Contest => ({
  id: row.id,
  title: row.title,
  description: row.description,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  prizeAmount: row.prize_amount,
  winnerCount: row.winner_count ?? 1,
  winnerEntryId: row.winner_entry_id,
  runnerUpEntryId: row.runner_up_entry_id ?? null,
  announcedAt: row.announced_at,
  prizePaid: row.prize_paid,
});

const toEntry = (row: EntryRow): ContestEntry => ({
  id: row.entry_id,
  recipeId: row.recipe_id,
  recipeSlug: row.recipe_slug,
  recipeTitle: row.recipe_title,
  recipeImage: safeImageUrl(row.recipe_image, BUCKETS.recipeImages) || FALLBACK_RECIPE_IMAGE,
  userId: row.user_id,
  authorName: row.author_name,
  authorUsername: row.author_username,
  authorAvatar: safeImageUrl(row.author_avatar, BUCKETS.avatars),
  votes: row.votes,
  votedByMe: row.voted_by_me,
  createdAt: row.created_at,
});

type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };

function failure(error: { code?: string; message?: string } | null, fallback: string): { ok: false; error: string } {
  if (error?.code === "23505") return { ok: false, error: "You've already entered this contest." };
  if (error?.code === "42501") return { ok: false, error: "That isn't allowed right now. The contest may have closed." };
  if (error?.code === "54000") return { ok: false, error: "You're doing that too often. Please try again later." };
  return { ok: false, error: fallback };
}

/** Newest first (the current or next contest, then past ones). */
export async function listContests(): Promise<Contest[]> {
  const ctx = userContext();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase.from("contests").select("*").order("starts_at", { ascending: false }).limit(30);
  if (error) throw error;
  return (data ?? []).map(toContest);
}

/** Entries with vote counts, most votes first. */
export async function listEntries(contestId: string): Promise<ContestEntry[]> {
  const ctx = userContext();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase.rpc("contest_entries_with_votes", { p_contest: contestId });
  if (error) throw error;
  return (data ?? []).map(toEntry);
}

/** Premium members enter one of their own published recipes. */
export async function enterContest(contestId: string, recipeId: string): Promise<Result> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { error } = await ctx.supabase
    .from("contest_entries")
    .insert({ contest_id: contestId, recipe_id: recipeId, user_id: ctx.userId });
  return error ? failure(error, "We couldn't enter your recipe. Please try again.") : { ok: true, value: undefined };
}

/** Withdraws an entry (members, while the contest is open) or removes it (admins). */
export async function removeEntry(entryId: string): Promise<Result> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { error } = await ctx.supabase.from("contest_entries").delete().eq("id", entryId);
  return error ? failure(error, "We couldn't remove that entry.") : { ok: true, value: undefined };
}

export async function setVote(entryId: string, vote: boolean): Promise<Result> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { error } = vote
    ? await ctx.supabase.from("contest_votes").insert({ entry_id: entryId, user_id: ctx.userId })
    : await ctx.supabase.from("contest_votes").delete().eq("entry_id", entryId).eq("user_id", ctx.userId);
  return error ? failure(error, "We couldn't save your vote. Please try again.") : { ok: true, value: undefined };
}

/* ---------- Admin ---------- */

export interface ContestInput {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  prizeAmount: number;
  winnerCount: number;
}

export async function createContest(input: ContestInput): Promise<Result> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { error } = await ctx.supabase.from("contests").insert({
    title: input.title,
    description: input.description,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    prize_amount: input.prizeAmount,
    winner_count: input.winnerCount,
  });
  return error ? failure(error, "We couldn't create the contest. Check the dates and try again.") : { ok: true, value: undefined };
}

export async function setPrizePaid(contestId: string, paid: boolean): Promise<Result> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { error } = await ctx.supabase.from("contests").update({ prize_paid: paid }).eq("id", contestId);
  return error ? failure(error, "We couldn't update the contest.") : { ok: true, value: undefined };
}

export async function deleteContest(contestId: string): Promise<Result> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { error } = await ctx.supabase.from("contests").delete().eq("id", contestId);
  return error ? failure(error, "We couldn't delete the contest.") : { ok: true, value: undefined };
}

/** Picks the most-voted entry (and runner-up, for 2-winner contests); each author gets a free Premium month. */
export async function announceWinner(contestId: string): Promise<Result<string | null>> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { data, error } = await ctx.supabase.rpc("admin_announce_winner", { p_contest: contestId });
  if (error) return { ok: false, error: error.message || "We couldn't announce the winner." };
  return { ok: true, value: data ?? null };
}

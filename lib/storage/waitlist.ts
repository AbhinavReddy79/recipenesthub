import { getSupabase } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";
import { userContext } from "./remote";

export type WaitlistEntry = Database["public"]["Tables"]["launch_waitlist"]["Row"];

/** "Notify me at launch" from the countdown page. Works signed out. */
export async function joinWaitlist(email: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Sign-ups aren't available right now. Please try again later." };
  const { error } = await supabase.rpc("join_launch_waitlist", { p_email: email.trim() });
  if (!error) return { ok: true };
  if (error.code === "22023") return { ok: false, error: "Please enter a valid email address." };
  if (error.code === "54000") return { ok: false, error: "Lots of people are signing up right now. Please try again in a minute." };
  return { ok: false, error: "We couldn't add you. Please try again." };
}

/* ---------- Admin (owner, or admins with the "Members" power) ---------- */

export async function listWaitlist(): Promise<WaitlistEntry[]> {
  const ctx = userContext();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase.from("launch_waitlist").select("*").order("created_at", { ascending: false }).limit(5000);
  if (error) throw error;
  return data ?? [];
}

/** Marks everyone not yet notified as notified (after the launch email goes out). */
export async function markWaitlistNotified(): Promise<boolean> {
  const ctx = userContext();
  if (!ctx) return false;
  const { error } = await ctx.supabase.from("launch_waitlist").update({ notified_at: new Date().toISOString() }).is("notified_at", null);
  return !error;
}

export async function removeFromWaitlist(email: string): Promise<boolean> {
  const ctx = userContext();
  if (!ctx) return false;
  const { error } = await ctx.supabase.from("launch_waitlist").delete().eq("email", email);
  return !error;
}

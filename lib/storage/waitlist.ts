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

/**
 * Emails the winners' names, emails and recipes to the owner, right after an
 * admin announces a contest or draws a lucky draw. Returns false if it failed.
 */
export async function emailWinnersToOwner(kind: "contest" | "draw", id: string): Promise<boolean> {
  const ctx = userContext();
  if (!ctx) return false;
  const { data, error } = await ctx.supabase.functions.invoke<{ ok?: boolean }>("send-launch-email", {
    body: { mode: "winners", kind, id },
  });
  if (error || !data?.ok) console.error("winners email failed", error);
  return !error && Boolean(data?.ok);
}

export type LaunchEmailResult =
  | { ok: true; sentTo?: string; sent?: number; failed?: string[]; remaining?: number }
  | { ok: false; error: string };

/**
 * Sends the launch email through the send-launch-email Edge Function (the owner's Gmail).
 * "test" sends one copy to you; "direct" emails the addresses you typed in (no
 * account is created); "send" emails the next batch of people not yet
 * notified and reports how many are left.
 */
export async function sendLaunchEmail(
  mode: "test" | "send" | "direct",
  subject: string,
  message: string,
  emails?: string[],
  variant: "launch" | "teaser" = "launch",
): Promise<LaunchEmailResult> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const { data, error } = await ctx.supabase.functions.invoke<LaunchEmailResult & { error?: string }>("send-launch-email", {
    body: { mode, subject, message, emails, variant },
  });
  if (!error && data?.ok) return data;
  // Errors from the function arrive with its JSON body in the response context.
  let code = data && "error" in data ? data.error : undefined;
  if (error && "context" in error && error.context instanceof Response) {
    code = ((await error.context.json().catch(() => ({}))) as { error?: string }).error;
  }
  const messages: Record<string, string> = {
    email_not_configured: "Email isn't set up yet: add BREVO_API_KEY (or the Gmail secrets) in Supabase (Edge Functions, Secrets).",
    send_failed: "The email service refused the email. Check the Brevo secrets in Supabase (and that the sender is verified in Brevo).",
    invalid_content: "Write a subject and a message first.",
    not_admin: "Only the owner, or admins who manage members, can send this.",
    owner_only: "Only the owner can send the launch invitation. Admins can send the pre-launch teaser.",
    signed_out: "Please log in again.",
    no_email: "Your account has no email address to send the test to.",
    invalid_emails: "Enter at least one valid email address.",
    too_many_emails: "Too many addresses in one go. Please try again.",
  };
  if (!code) console.error("launch email failed", error);
  return {
    ok: false,
    error: messages[code ?? ""] ?? "We couldn't reach the email service. Is the send-launch-email function deployed?",
  };
}

import type { Database } from "@/lib/supabase/database.types";
import { userContext } from "./remote";

/** An invitation email set to go out later (sent by the minute timer in Supabase). */
export type ScheduledEmail = Database["public"]["Tables"]["scheduled_emails"]["Row"];

export async function listScheduledEmails(): Promise<ScheduledEmail[]> {
  const ctx = userContext();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase.from("scheduled_emails").select("*").order("send_at", { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function scheduleEmail(input: {
  subject: string;
  message: string;
  audience: "waitlist" | "direct";
  emails: string[];
  sendAt: Date;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  if (input.sendAt.getTime() < Date.now() + 60_000) return { ok: false, error: "Pick a time at least a minute from now." };
  const { error } = await ctx.supabase.from("scheduled_emails").insert({
    subject: input.subject.trim(),
    message: input.message.trim(),
    audience: input.audience,
    emails: input.audience === "direct" ? input.emails : [],
    send_at: input.sendAt.toISOString(),
    created_by: ctx.userId,
  });
  if (!error) return { ok: true };
  if (error.code === "42501") return { ok: false, error: "Only the owner, or admins who manage members, can schedule emails." };
  if (error.code === "23514") return { ok: false, error: "Check the subject, message and addresses (up to 25)." };
  if (error.code === "42P01") return { ok: false, error: "Scheduling isn't set up yet: run the scheduled-emails database script." };
  return { ok: false, error: "We couldn't schedule the email. Please try again." };
}

export async function cancelScheduledEmail(id: string): Promise<boolean> {
  const ctx = userContext();
  if (!ctx) return false;
  const { data, error } = await ctx.supabase.rpc("cancel_scheduled_email", { p_id: id });
  return !error && data === true;
}

export async function clearScheduledEmail(id: string): Promise<boolean> {
  const ctx = userContext();
  if (!ctx) return false;
  const { error } = await ctx.supabase.from("scheduled_emails").delete().eq("id", id);
  return !error;
}

import type { ContactTopic, Database } from "@/lib/supabase/database.types";
import { getSupabase } from "@/lib/supabase/client";
import { getActiveUserId } from "./session";
import { userContext } from "./remote";

export type ContactMessage = Database["public"]["Tables"]["contact_messages"]["Row"];

export const CONTACT_TOPICS: { value: ContactTopic; label: string }[] = [
  { value: "general", label: "General question" },
  { value: "billing", label: "Premium or lucky draw" },
  { value: "contest", label: "Weekly contest" },
  { value: "account", label: "My account" },
  { value: "other", label: "Something else" },
];

/** Sends a Contact page message. Works signed in or out; only admins can read messages. */
export async function sendContactMessage(input: {
  name: string;
  email: string;
  topic: ContactTopic;
  message: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Messages can't be sent right now. Please try again later." };
  const { error } = await supabase.from("contact_messages").insert({
    name: input.name,
    email: input.email,
    topic: input.topic,
    message: input.message,
    user_id: getActiveUserId(),
  });
  if (!error) return { ok: true };
  if (error.code === "54000") return { ok: false, error: "You've sent several messages already. Please wait an hour and try again." };
  if (error.code === "23514") return { ok: false, error: "Please check your email address and message, then try again." };
  console.error(error);
  return { ok: false, error: "We couldn't send your message. Please try again." };
}

/* ---------- Admin ---------- */

export async function listMessages(): Promise<ContactMessage[]> {
  const ctx = userContext();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) throw error;
  return data ?? [];
}

export async function setMessageHandled(id: string, handled: boolean): Promise<boolean> {
  const ctx = userContext();
  if (!ctx) return false;
  const { error } = await ctx.supabase.from("contact_messages").update({ handled }).eq("id", id);
  return !error;
}

export async function deleteMessage(id: string): Promise<boolean> {
  const ctx = userContext();
  if (!ctx) return false;
  const { error } = await ctx.supabase.from("contact_messages").delete().eq("id", id);
  return !error;
}

/* ---------- Replies (admin dashboard and the sender's Support messages page) ---------- */

export type ContactReply = Database["public"]["Tables"]["contact_replies"]["Row"];

/** Replies for these messages, oldest first. Admins see all; members only their own. */
export async function listReplies(messageIds: string[]): Promise<ContactReply[]> {
  const ctx = userContext();
  if (!ctx || messageIds.length === 0) return [];
  const { data, error } = await ctx.supabase
    .from("contact_replies")
    .select("*")
    .in("message_id", messageIds)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function sendReply(
  messageId: string,
  body: string,
  fromAdmin: boolean,
): Promise<{ ok: true; reply: ContactReply } | { ok: false; error: string }> {
  const ctx = userContext();
  if (!ctx) return { ok: false, error: "Please log in again." };
  const text = body.trim();
  if (!text) return { ok: false, error: "Write a reply first." };
  if (text.length > 2000) return { ok: false, error: "Replies can be up to 2000 characters." };
  const { data, error } = await ctx.supabase
    .from("contact_replies")
    .insert({ message_id: messageId, author_id: ctx.userId, from_admin: fromAdmin, body: text })
    .select("*")
    .single();
  if (!error && data) return { ok: true, reply: data };
  if (error?.code === "54000") return { ok: false, error: "You're replying too often. Please wait a little and try again." };
  if (error?.code === "42501") return { ok: false, error: "You can't reply to this message." };
  return { ok: false, error: "We couldn't send your reply. Please try again." };
}

/** The signed-in member's own Contact messages, newest first. */
export async function listMyMessages(): Promise<ContactMessage[]> {
  const ctx = userContext();
  if (!ctx) return [];
  const { data, error } = await ctx.supabase
    .from("contact_messages")
    .select("*")
    .eq("user_id", ctx.userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function markMessageRead(id: string): Promise<void> {
  const ctx = userContext();
  if (!ctx) return;
  await ctx.supabase.rpc("mark_contact_message_read", { p_message: id });
}

/** How many of my conversations have a reply from RecipeNest I haven't opened. */
export async function unreadSupportReplies(): Promise<number> {
  const ctx = userContext();
  if (!ctx) return 0;
  const { data, error } = await ctx.supabase.rpc("my_unread_support_replies");
  return error ? 0 : (data ?? 0);
}

/** Admin: messages still waiting for a reply. */
export async function countOpenMessages(): Promise<number> {
  const ctx = userContext();
  if (!ctx) return 0;
  const { count, error } = await ctx.supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("handled", false);
  return error ? 0 : (count ?? 0);
}

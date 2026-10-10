import type { ContactTopic, Database } from "@/lib/supabase/database.types";
import { getSupabase } from "@/lib/supabase/client";
import { getActiveUserId } from "./session";
import { userContext } from "./remote";

export type ContactMessage = Database["public"]["Tables"]["contact_messages"]["Row"];

export const CONTACT_TOPICS: { value: ContactTopic; label: string }[] = [
  { value: "general", label: "General question" },
  { value: "billing", label: "Premium or payments" },
  { value: "refund", label: "Refund request" },
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

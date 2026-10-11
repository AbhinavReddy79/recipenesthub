"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { refreshUnreadSupport } from "@/hooks/use-unread-support";
import { formatDate } from "@/lib/format";
import {
  CONTACT_TOPICS,
  listMyMessages,
  listReplies,
  markMessageRead,
  sendReply,
  type ContactMessage,
  type ContactReply,
} from "@/lib/storage/messages";
import { cn } from "@/lib/utils";

const topicLabel = (topic: string) => CONTACT_TOPICS.find((t) => t.value === topic)?.label ?? topic;

const hasUnread = (m: ContactMessage, thread: ContactReply[]) =>
  thread.some((r) => r.from_admin && (!m.user_read_at || r.created_at > m.user_read_at));

/** The member's own Contact messages as conversations with RecipeNest. */
export function SupportMessages() {
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [replies, setReplies] = useState<ContactReply[]>([]);

  useEffect(() => {
    let cancelled = false;
    listMyMessages()
      .then(async (list) => {
        if (cancelled) return;
        setMessages(list);
        const all = await listReplies(list.map((m) => m.id)).catch(() => [] as ContactReply[]);
        if (cancelled) return;
        setReplies(all);
        // Opening this page counts as reading every reply (the "New reply" labels stay until the next visit).
        const unread = list.filter((m) => hasUnread(m, all.filter((r) => r.message_id === m.id)));
        if (unread.length) {
          await Promise.all(unread.map((m) => markMessageRead(m.id)));
          refreshUnreadSupport();
        }
      })
      .catch(() => !cancelled && setMessages([]));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!messages) return <ListSkeleton rows={3} />;

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No messages yet"
        description="Questions, problems or ideas? Send us a message while signed in and our reply will appear here."
        actions={
          <Button asChild>
            <Link href="/contact">Contact us</Link>
          </Button>
        }
      />
    );
  }

  return (
    <ul className="mx-auto grid max-w-3xl gap-5">
      {messages.map((m) => {
        const thread = replies.filter((r) => r.message_id === m.id);
        const isNew = hasUnread(m, thread);
        const answered = thread.some((r) => r.from_admin);
        return (
          <li key={m.id} className="grid gap-4 rounded-2xl border bg-card p-4 shadow-soft sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">
                {topicLabel(m.topic)} · {formatDate(m.created_at)}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  isNew ? "bg-primary text-primary-foreground" : answered ? "bg-herb-soft text-herb" : "bg-muted text-muted-foreground",
                )}
              >
                {isNew ? "New reply" : answered ? "Replied" : "Waiting for a reply"}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{m.message}</p>
            {thread.length > 0 && (
              <ol className="grid gap-2 border-l-2 border-border pl-4">
                {thread.map((r) => (
                  <li key={r.id} className={cn("grid gap-1 rounded-xl p-3 text-sm", r.from_admin ? "bg-primary/10" : "bg-muted")}>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      {r.from_admin && <ShieldCheck className="size-3.5" aria-hidden />}
                      {r.from_admin ? "RecipeNest team" : "You"} · {formatDate(r.created_at)}
                    </span>
                    <p className="whitespace-pre-wrap">{r.body}</p>
                  </li>
                ))}
              </ol>
            )}
            <AnswerBox messageId={m.id} onSent={(reply) => setReplies((list) => [...list, reply])} />
          </li>
        );
      })}
    </ul>
  );
}

function AnswerBox({ messageId, onSent }: { messageId: string; onSent: (reply: ContactReply) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    const result = await sendReply(messageId, text, false);
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    onSent(result.reply);
    setText("");
    toast.success("Sent. We'll reply here.");
  };

  return (
    <div className="grid gap-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        maxLength={2000}
        placeholder="Write a reply…"
        aria-label="Write a reply"
      />
      <Button size="sm" className="justify-self-end" disabled={busy || !text.trim()} onClick={submit}>
        {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
        Send
      </Button>
    </div>
  );
}

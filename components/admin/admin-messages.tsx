"use client";

import { useEffect, useMemo, useState } from "react";
import { Inbox, Loader2, Mail, Send, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate } from "@/lib/format";
import {
  CONTACT_TOPICS,
  deleteMessage,
  listMessages,
  listReplies,
  sendReply,
  setMessageHandled,
  type ContactMessage,
  type ContactReply,
} from "@/lib/storage/messages";
import { cn } from "@/lib/utils";
import { AdminToolbar } from "./admin-toolbar";

const topicLabel = (topic: string) => CONTACT_TOPICS.find((t) => t.value === topic)?.label ?? topic;

/** Messages sent from the Contact page. Reply here: members read it on their Support page, guests by email. */
export function AdminMessages() {
  const { isAdmin } = useCurrentUser();
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [replies, setReplies] = useState<ContactReply[]>([]);
  const [search, setSearch] = useState("");
  const [show, setShow] = useState("open");

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    listMessages()
      .then(async (list) => {
        if (cancelled) return;
        setMessages(list);
        const all = await listReplies(list.map((m) => m.id)).catch(() => [] as ContactReply[]);
        if (!cancelled) setReplies(all);
      })
      .catch(() => !cancelled && setMessages([]));
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (messages ?? []).filter(
      (m) =>
        (show === "all" || (show === "open" ? !m.handled : m.handled)) &&
        (!q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.message.toLowerCase().includes(q)),
    );
  }, [messages, search, show]);

  if (!messages) return <ListSkeleton rows={4} />;

  if (messages.length === 0) {
    return <EmptyState icon={Inbox} title="No messages yet" description="Messages from the Contact page will appear here." />;
  }

  const toggle = async (message: ContactMessage, handled: boolean) => {
    setMessages((list) => list?.map((m) => (m.id === message.id ? { ...m, handled } : m)) ?? null);
    if (!(await setMessageHandled(message.id, handled))) {
      toast.error("We couldn't update that message.");
      setMessages((list) => list?.map((m) => (m.id === message.id ? { ...m, handled: !handled } : m)) ?? null);
    }
  };

  const onReplied = (message: ContactMessage, reply: ContactReply) => {
    setReplies((list) => [...list, reply]);
    setMessages((list) => list?.map((m) => (m.id === message.id ? { ...m, handled: true } : m)) ?? null);
  };

  const remove = async (message: ContactMessage) => {
    if (!window.confirm(`Delete the message from ${message.name}?`)) return;
    if (!(await deleteMessage(message.id))) return toast.error("We couldn't delete that message.");
    setMessages((list) => list?.filter((m) => m.id !== message.id) ?? null);
    toast.success("Message deleted.");
  };

  return (
    <div className="grid gap-5">
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search by name, email or text"
        resultCount={visible.length}
        noun="message"
        filters={[
          {
            label: "Show",
            value: show,
            onChange: setShow,
            options: [
              { value: "open", label: "Needs a reply" },
              { value: "handled", label: "Handled" },
              { value: "all", label: "All messages" },
            ],
          },
        ]}
      />
      <ul className="grid gap-3">
        {visible.map((m) => (
          <li key={m.id} className={cn("grid gap-3 rounded-2xl border bg-card p-4 shadow-soft sm:p-5", m.handled && "opacity-70")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="grid">
                <span className="font-semibold">{m.name}</span>
                <span className="text-sm text-muted-foreground">
                  {m.email} · {formatDate(m.created_at)}
                </span>
              </div>
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">{topicLabel(m.topic)}</span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{m.message}</p>
            <Thread replies={replies.filter((r) => r.message_id === m.id)} senderName={m.name} />
            <ReplyBox message={m} onReplied={(reply) => onReplied(m, reply)} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Switch checked={m.handled} onCheckedChange={(on) => toggle(m, on)} />
                Handled
              </label>
              <div className="flex items-center gap-1">
                <Button size="icon-sm" variant="ghost" aria-label={`Delete message from ${m.name}`} onClick={() => remove(m)}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const mailtoReply = (m: ContactMessage, body: string) =>
  `mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: your message to RecipeNest")}&body=${encodeURIComponent(
    `${body}

---
You wrote on ${formatDate(m.created_at)}:
${m.message}`,
  )}`;

/** The conversation after the first message: admin replies and the sender's answers. */
function Thread({ replies, senderName }: { replies: ContactReply[]; senderName: string }) {
  if (replies.length === 0) return null;
  return (
    <ol className="grid gap-2 border-l-2 border-border pl-4">
      {replies.map((r) => (
        <li key={r.id} className={cn("grid gap-1 rounded-xl p-3 text-sm", r.from_admin ? "bg-primary/10" : "bg-muted")}>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            {r.from_admin ? <ShieldCheck className="size-3.5" aria-hidden /> : <UserRound className="size-3.5" aria-hidden />}
            {r.from_admin ? "RecipeNest" : senderName} · {formatDate(r.created_at)}
          </span>
          <p className="whitespace-pre-wrap">{r.body}</p>
        </li>
      ))}
    </ol>
  );
}

/**
 * Members (signed in when they wrote) get the reply on their Support messages page.
 * Guests can only be answered by email: the reply is saved here and the admin's mail app opens with it filled in.
 */
function ReplyBox({ message, onReplied }: { message: ContactMessage; onReplied: (reply: ContactReply) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const isMember = Boolean(message.user_id);

  const submit = async () => {
    setBusy(true);
    const result = await sendReply(message.id, text, true);
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    onReplied(result.reply);
    if (!isMember) window.location.href = mailtoReply(message, result.reply.body);
    toast.success(isMember ? `Reply sent. ${message.name} will see it on their Support messages page.` : "Reply saved. Send it from your email app.");
    setText("");
  };

  return (
    <div className="grid gap-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder={isMember ? `Reply to ${message.name}…` : `Write your email reply to ${message.name}…`}
        aria-label={`Reply to ${message.name}`}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {isMember
            ? "Member: they'll see your reply in RecipeNest under Support messages and can answer back."
            : "Guest (wasn't signed in): your reply opens in your email app to send."}
        </p>
        <Button size="sm" disabled={busy || !text.trim()} onClick={submit}>
          {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : isMember ? <Send data-icon="inline-start" /> : <Mail data-icon="inline-start" />}
          {isMember ? "Send reply" : "Reply by email"}
        </Button>
      </div>
    </div>
  );
}

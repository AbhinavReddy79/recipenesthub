"use client";

import { useEffect, useMemo, useState } from "react";
import { Inbox, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/skeletons";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useCurrentUser } from "@/hooks/use-current-user";
import { formatDate } from "@/lib/format";
import { CONTACT_TOPICS, deleteMessage, listMessages, setMessageHandled, type ContactMessage } from "@/lib/storage/messages";
import { cn } from "@/lib/utils";
import { AdminToolbar } from "./admin-toolbar";

const topicLabel = (topic: string) => CONTACT_TOPICS.find((t) => t.value === topic)?.label ?? topic;

/** Messages sent from the Contact page. Reply by email, then mark them handled. */
export function AdminMessages() {
  const { isAdmin } = useCurrentUser();
  const [messages, setMessages] = useState<ContactMessage[] | null>(null);
  const [search, setSearch] = useState("");
  const [show, setShow] = useState("open");

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    listMessages()
      .then((list) => !cancelled && setMessages(list))
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
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Switch checked={m.handled} onCheckedChange={(on) => toggle(m, on)} />
                Handled
              </label>
              <div className="flex items-center gap-1">
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent("Re: your message to RecipeNest")}`}>
                    <Mail data-icon="inline-start" />
                    Reply by email
                  </a>
                </Button>
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

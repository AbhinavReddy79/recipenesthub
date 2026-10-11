"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelScheduledEmail, clearScheduledEmail, listScheduledEmails, type ScheduledEmail } from "@/lib/storage/scheduled-emails";
import { cn } from "@/lib/utils";

const STATUS: Record<ScheduledEmail["status"], { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-accent text-accent-foreground" },
  sending: { label: "Sending…", className: "bg-primary/15 text-primary" },
  sent: { label: "Sent", className: "bg-herb-soft text-herb" },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

/** Scheduled invitation emails, with cancel (before sending) and clear (after). Refreshes when `version` changes. */
export function ScheduledEmailsList({ version }: { version: number }) {
  const [items, setItems] = useState<ScheduledEmail[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      listScheduledEmails()
        .then((list) => !cancelled && setItems(list))
        .catch(() => !cancelled && setItems([]));
    void load();
    // Keep statuses fresh while an email is waiting or going out.
    const id = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [version]);

  if (!items?.length) return null;

  const cancel = async (item: ScheduledEmail) => {
    if (!window.confirm(`Cancel “${item.subject}”? It won't be sent.`)) return;
    if (!(await cancelScheduledEmail(item.id))) return toast.error("It may already be sending, so it couldn't be cancelled.");
    setItems((list) => list?.map((e) => (e.id === item.id ? { ...e, status: "cancelled" } : e)) ?? null);
    toast.success("Scheduled email cancelled.");
  };

  const clear = async (item: ScheduledEmail) => {
    if (!(await clearScheduledEmail(item.id))) return toast.error("We couldn't remove it.");
    setItems((list) => list?.filter((e) => e.id !== item.id) ?? null);
  };

  return (
    <div className="grid gap-2">
      <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
        <CalendarClock className="size-4 text-primary" aria-hidden />
        Scheduled emails
      </h3>
      <ul className="grid gap-2">
        {items.map((item) => {
          const status = STATUS[item.status];
          const to = item.audience === "waitlist" ? "Launch waitlist" : `${item.emails.length} ${item.emails.length === 1 ? "address" : "addresses"}`;
          return (
            <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border p-3 text-sm">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", status.className)}>{status.label}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.subject}</span>
                <span className="text-xs text-muted-foreground">
                  {to} · {item.status === "sent" ? `sent to ${item.sent_count}` : when(item.send_at)}
                  {item.failed_emails.length > 0 && ` · ${item.failed_emails.length} failed`}
                  {item.error && ` · ${item.error}`}
                </span>
              </span>
              {item.status === "scheduled" && (
                <Button size="sm" variant="outline" onClick={() => cancel(item)}>
                  <X data-icon="inline-start" />
                  Cancel
                </Button>
              )}
              {(item.status === "sent" || item.status === "failed" || item.status === "cancelled") && (
                <Button size="icon-sm" variant="ghost" aria-label={`Remove “${item.subject}” from the list`} onClick={() => clear(item)}>
                  <Trash2 />
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

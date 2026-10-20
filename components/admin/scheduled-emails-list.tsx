"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ChevronDown, History, Pencil, RotateCw, Trash2, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cancelScheduledEmail, clearScheduledEmail, listScheduledEmails, type ScheduledEmail } from "@/lib/storage/scheduled-emails";
import { useAdminPowers } from "@/lib/storage/admin-powers";
import { cn } from "@/lib/utils";
import { EditScheduledEmailDialog } from "./edit-scheduled-email-dialog";

const STATUS: Record<ScheduledEmail["status"], { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-accent text-accent-foreground" },
  sending: { label: "Sending…", className: "bg-primary/15 text-primary" },
  sent: { label: "Sent", className: "bg-herb-soft text-herb" },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive" },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground" },
};

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");

/**
 * Every invitation email: scheduled ones (with cancel) and ones sent with "Send now".
 * Each row opens into the full details: who it went to, when, and what failed.
 * Refreshes when `version` changes, and every 30 seconds.
 */
export function ScheduledEmailsList({ version }: { version: number }) {
  const [items, setItems] = useState<ScheduledEmail[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<ScheduledEmail | null>(null);
  // The launch invitation and the history itself belong to the owner.
  const { owner } = useAdminPowers();

  const load = () =>
    listScheduledEmails()
      .then(setItems)
      .catch(() => setItems([]));

  useEffect(() => {
    let cancelled = false;
    const fetchList = () =>
      listScheduledEmails()
        .then((list) => !cancelled && setItems(list))
        .catch(() => !cancelled && setItems([]));
    void fetchList();
    // Keep statuses fresh while an email is waiting or going out.
    const id = window.setInterval(fetchList, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [version]);

  if (!items?.length) return null;

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const cancel = async (item: ScheduledEmail) => {
    if (!window.confirm(`Cancel “${item.subject}”? It won't be sent.`)) return;
    if (!(await cancelScheduledEmail(item.id))) return toast.error("It may already be sending, so it couldn't be cancelled.");
    setItems((list) => list?.map((e) => (e.id === item.id ? { ...e, status: "cancelled" } : e)) ?? null);
    toast.success("Scheduled email cancelled.");
  };

  const clear = async (item: ScheduledEmail) => {
    if (!window.confirm(`Remove “${item.subject}” from the history? The email itself isn't affected.`)) return;
    if (!(await clearScheduledEmail(item.id))) return toast.error("We couldn't remove it.");
    setItems((list) => list?.filter((e) => e.id !== item.id) ?? null);
  };

  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
          <History className="size-4 text-primary" aria-hidden />
          Invitation emails
        </h3>
        <Button size="sm" variant="ghost" onClick={refresh} disabled={refreshing}>
          <RotateCw data-icon="inline-start" className={cn(refreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>
      <ul className="grid gap-2">
        {items.map((item) => {
          const status = STATUS[item.status];
          const open = openId === item.id;
          const to =
            item.audience === "waitlist"
              ? "Launch waitlist"
              : `${item.emails.length} ${item.emails.length === 1 ? "address" : "addresses"}`;
          const summary =
            item.status === "sent" || item.status === "failed"
              ? `sent to ${item.sent_count}${item.failed_emails.length ? `, ${item.failed_emails.length} failed` : ""} · ${when(item.finished_at)}`
              : item.status === "scheduled" && item.sent_count > 0
                ? `${item.sent_count} sent so far, continuing`
                : `for ${when(item.send_at)}`;
          return (
            <li key={item.id} className="rounded-xl border text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 p-3">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", status.className)}>{status.label}</span>
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : item.id)}
                  aria-expanded={open}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{item.subject}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      {item.kind === "instant" ? <Zap className="size-3" aria-hidden /> : <CalendarClock className="size-3" aria-hidden />}
                      {to} · {summary}
                    </span>
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} aria-hidden />
                </button>
                {item.status === "scheduled" && item.sent_count === 0 && (owner || item.variant === "teaser") && (
                  <Button size="sm" variant="outline" onClick={() => setEditing(item)}>
                    <Pencil data-icon="inline-start" />
                    Edit
                  </Button>
                )}
                {item.status === "scheduled" && item.sent_count === 0 && (owner || item.variant === "teaser") && (
                  <Button size="sm" variant="outline" onClick={() => cancel(item)}>
                    <X data-icon="inline-start" />
                    Cancel
                  </Button>
                )}
                {owner && (item.status === "sent" || item.status === "failed" || item.status === "cancelled") && (
                  <Button size="icon-sm" variant="ghost" aria-label={`Remove “${item.subject}” from the history`} onClick={() => clear(item)}>
                    <Trash2 />
                  </Button>
                )}
              </div>
              {open && <EmailDetails item={item} />}
            </li>
          );
        })}
      </ul>
      <EditScheduledEmailDialog email={editing} onOpenChange={(open) => !open && setEditing(null)} onSaved={() => void load()} />
    </div>
  );
}

function EmailDetails({ item }: { item: ScheduledEmail }) {
  const rows: [string, React.ReactNode][] = [
    ["How", item.kind === "instant" ? "Sent with “Send now”" : "Scheduled"],
    [
      "Type",
      item.variant === "teaser"
        ? "Pre-launch teaser (“Get notified at launch”)"
        : item.variant === "members"
          ? "Members announcement (“Open RecipeNest”)"
          : "Launch invitation (“Join RecipeNest”)",
    ],
    ["To", item.audience === "waitlist" ? "Everyone on the launch waitlist not yet emailed" : item.emails.join(", ")],
    ["Created", when(item.created_at)],
    ...(item.kind === "scheduled" ? ([["Scheduled for", when(item.send_at)]] as [string, React.ReactNode][]) : []),
    ["Started sending", when(item.claimed_at)],
    ["Finished", when(item.finished_at)],
    ["Delivered to", `${item.sent_count} ${item.sent_count === 1 ? "person" : "people"}`],
  ];
  return (
    <div className="grid gap-3 border-t bg-muted/40 p-3">
      <dl className="grid gap-1.5 text-xs sm:grid-cols-[auto_1fr] sm:gap-x-4">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="font-semibold text-muted-foreground">{label}</dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>
      {item.error && <p className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">Problem: {item.error}</p>}
      {item.sent_to.length > 0 && <AddressList title="Sent to" emails={item.sent_to} />}
      {item.failed_emails.length > 0 && <AddressList title="Couldn't be sent to" emails={item.failed_emails} tone="bad" />}
      <details className="text-xs">
        <summary className="cursor-pointer font-semibold text-muted-foreground">Message</summary>
        <p className="mt-2 font-semibold">{item.subject}</p>
        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{item.message}</p>
      </details>
    </div>
  );
}

function AddressList({ title, emails, tone }: { title: string; emails: string[]; tone?: "bad" }) {
  return (
    <div className="grid gap-1 text-xs">
      <p className={cn("font-semibold", tone === "bad" ? "text-destructive" : "text-muted-foreground")}>
        {title} ({emails.length})
      </p>
      <ul className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
        {emails.map((email) => (
          <li key={email} className={cn("rounded-full px-2 py-0.5", tone === "bad" ? "bg-destructive/10 text-destructive" : "bg-background ring-1 ring-border")}>
            {email}
          </li>
        ))}
      </ul>
    </div>
  );
}

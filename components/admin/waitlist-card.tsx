"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, Check, ChevronDown, Copy, Download, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { useAdminPowers } from "@/lib/storage/admin-powers";
import { listWaitlist, markWaitlistNotified, removeFromWaitlist, type WaitlistEntry } from "@/lib/storage/waitlist";
import { cn } from "@/lib/utils";
import { LaunchEmailDialog } from "./launch-email-dialog";

/** Dashboard: people who asked to be emailed at launch (owner and admins with the Members power). */
export function WaitlistCard() {
  const { members: canSee } = useAdminPowers();
  const [entries, setEntries] = useState<WaitlistEntry[] | null>(null);
  const [open, setOpen] = useState(false);
  const [emailing, setEmailing] = useState(false);

  const reload = useCallback(() => {
    listWaitlist()
      .then(setEntries)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!canSee) return;
    let cancelled = false;
    listWaitlist()
      .then((list) => !cancelled && setEntries(list))
      .catch(() => !cancelled && setEntries([]));
    return () => {
      cancelled = true;
    };
  }, [canSee]);

  if (!canSee || !entries) return null;

  const waiting = entries.filter((e) => !e.notified_at);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(waiting.map((e) => e.email).join(", "));
      toast.success(`Copied ${waiting.length} ${waiting.length === 1 ? "email" : "emails"}. Paste them into the Bcc field.`);
    } catch {
      toast.error("Your browser blocked copying. Use Download CSV instead.");
    }
  };

  const download = () => {
    const rows = [["email", "signed_up", "notified"], ...entries.map((e) => [e.email, e.created_at, e.notified_at ?? ""])];
    // Quote every field, and stop spreadsheet apps treating a value as a formula.
    const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`;
    const blob = new Blob([rows.map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipenest-launch-waitlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const markAll = async () => {
    if (!window.confirm(`Mark all ${waiting.length} as notified? Do this after you've sent the launch email.`)) return;
    if (!(await markWaitlistNotified())) return toast.error("We couldn't update the list.");
    const now = new Date().toISOString();
    setEntries((list) => list?.map((e) => (e.notified_at ? e : { ...e, notified_at: now })) ?? null);
    toast.success("Marked as notified.");
  };

  const remove = async (email: string) => {
    if (!window.confirm(`Remove ${email} from the launch list?`)) return;
    if (!(await removeFromWaitlist(email))) return toast.error("We couldn't remove that email.");
    setEntries((list) => list?.filter((e) => e.email !== email) ?? null);
  };

  return (
    <section aria-labelledby="waitlist-heading" className="grid gap-4 rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BellRing className="size-5" aria-hidden />
        </span>
        <div className="grid flex-1">
          <h2 id="waitlist-heading" className="font-semibold">
            Launch waitlist: {entries.length} {entries.length === 1 ? "person" : "people"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {waiting.length > 0
              ? `${waiting.length} to email when you launch. Signed up on the countdown page.`
              : entries.length
                ? "Everyone has been notified."
                : "Sign-ups from the countdown page's “Notify me” box appear here."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {entries.length > 0 && (
            <>
              <Button size="sm" variant="outline" onClick={copy} disabled={!waiting.length}>
                <Copy data-icon="inline-start" />
                Copy emails
              </Button>
              <Button size="sm" variant="outline" onClick={download}>
                <Download data-icon="inline-start" />
                Download CSV
              </Button>
              <Button size="sm" variant="outline" onClick={markAll} disabled={!waiting.length}>
                <Check data-icon="inline-start" />
                Mark notified
              </Button>
            </>
          )}
          {/* Always available: email the waitlist, or invite specific people by address. */}
          <Button size="sm" onClick={() => setEmailing(true)}>
            <Send data-icon="inline-start" />
            Send invitations
          </Button>
        </div>
      </div>

      {entries.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 justify-self-start text-sm font-semibold text-primary"
          >
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
            {open ? "Hide emails" : "Show emails"}
          </button>
          {open && (
            <ul className="grid max-h-80 gap-1 overflow-y-auto rounded-xl border p-2 text-sm">
              {entries.map((e) => (
                <li key={e.email} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
                  <span className="min-w-0 truncate">{e.email}</span>
                  <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                    {e.notified_at ? "Notified" : formatDate(e.created_at)}
                    <Button size="icon-sm" variant="ghost" aria-label={`Remove ${e.email}`} onClick={() => remove(e.email)}>
                      <Trash2 />
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <LaunchEmailDialog open={emailing} onOpenChange={setEmailing} waiting={waiting.length} onSent={reload} />
    </section>
  );
}

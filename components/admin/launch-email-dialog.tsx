"use client";

import { useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendLaunchEmail } from "@/lib/storage/waitlist";

const DEFAULT_SUBJECT = "RecipeNest is live! Your invitation is here 🎉";
const DEFAULT_MESSAGE = `Hi there,

You asked us to let you know when RecipeNest opens, and today's the day!

RecipeNest brings together recipes from every Indian state and kitchens around the world, with a meal planner and smart shopping lists, all in one place.

Join free today, and your first month of Premium is on us: publish unlimited recipes and enter our weekly cooking contest.

See you in the kitchen,
The RecipeNest team`;

/**
 * Admin: email everyone on the launch waitlist straight from the dashboard.
 * They don't need an account; the email invites them to join.
 */
export function LaunchEmailDialog({
  open,
  onOpenChange,
  waiting,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** People not yet emailed. */
  waiting: number;
  /** Called after each batch so the list can refresh. */
  onSent: () => void;
}) {
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [busy, setBusy] = useState<"test" | "send" | null>(null);
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);

  const test = async () => {
    setBusy("test");
    const result = await sendLaunchEmail("test", subject, message);
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(`Test sent to ${result.sentTo}. Check your inbox (and spam folder).`);
  };

  const sendAll = async () => {
    if (!window.confirm(`Email ${waiting} ${waiting === 1 ? "person" : "people"} now? This can't be undone.`)) return;
    setBusy("send");
    const total = waiting;
    let sent = 0;
    let failed = 0;
    setProgress({ sent: 0, total });
    // The function sends a batch at a time; keep going until everyone is done or a batch sends nothing.
    for (;;) {
      const result = await sendLaunchEmail("send", subject, message);
      if (!result.ok) {
        toast.error(result.error);
        break;
      }
      sent += result.sent ?? 0;
      failed += result.failed?.length ?? 0;
      setProgress({ sent, total });
      onSent();
      if (!result.remaining || !result.sent) break;
    }
    setBusy(null);
    if (sent) toast.success(`Launch email sent to ${sent} ${sent === 1 ? "person" : "people"}.`);
    if (failed) toast.error(`${failed} couldn't be sent (Gmail sends about 500 a day). Try the rest again tomorrow.`);
    if (sent && !failed) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Send the launch email</DialogTitle>
          <DialogDescription>
            Goes to {waiting} {waiting === 1 ? "person" : "people"} on the waitlist who haven&apos;t been emailed yet, from your Gmail. They
            don&apos;t need an account: the email has a “Join RecipeNest” button. Send it after you press Launch, so the link works.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="launch-subject">Subject</Label>
            <Input id="launch-subject" value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="launch-message">Message</Label>
            <Textarea id="launch-message" value={message} maxLength={4000} rows={11} onChange={(e) => setMessage(e.target.value)} />
            <p className="text-xs text-muted-foreground">A gold “Join RecipeNest” button and a one-line footer are added below your message.</p>
          </div>
          {progress && (
            <p className="text-sm font-medium" role="status">
              Sent {progress.sent} of {progress.total}…
            </p>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={test} disabled={Boolean(busy)}>
            {busy === "test" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Mail data-icon="inline-start" />}
            Send a test to me
          </Button>
          <Button onClick={sendAll} disabled={Boolean(busy) || waiting === 0}>
            {busy === "send" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
            Send to {waiting} {waiting === 1 ? "person" : "people"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

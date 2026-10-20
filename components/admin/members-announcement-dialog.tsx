"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/lib/storage/core";
import { accountsStorage, accountsStore } from "@/lib/storage/accounts";
import { sendLaunchEmail } from "@/lib/storage/waitlist";

const DEFAULT_SUBJECT = "RecipeNest is live! 🎉";
const DEFAULT_MESSAGE = `Hi,

RecipeNest is officially open to everyone, and you were here from the start. Thank you!

Here's what's waiting for you:
• Recipes from every Indian state and kitchens around the world
• Your meal planner and smart shopping lists
• Our first weekly contest, "Your Favourite Telugu Dish": 2 winners get ₹500 each
• The Launch Week Lucky Draw: 5 winners get 3 months of Premium

The contest and lucky draw run until Tue 27 October.

Tap the button below to jump back in. Have a question or an idea? Just reply to this email.

Thanks,
The RecipeNest Team
Your next favourite recipe is waiting.`;

/** The function sends this many addresses per call (its BATCH). */
const GROUP = 25;

/** Owner: email an announcement to every active member (button: "Open RecipeNest"). */
export function MembersAnnouncementDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const accounts = useStore(accountsStore);
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [busy, setBusy] = useState<"test" | "send" | null>(null);
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);

  useEffect(() => {
    if (open) void accountsStorage.loadAll();
  }, [open]);

  const recipients = [...new Set(accounts.filter((a) => a.status === "active" && a.email).map((a) => a.email.trim().toLowerCase()))];

  const test = async () => {
    setBusy("test");
    const result = await sendLaunchEmail("test", subject, message, undefined, "members");
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(`Test sent to ${result.sentTo}. Check your inbox (and spam folder).`);
  };

  const send = async () => {
    if (!recipients.length) return toast.error("No members to email yet.");
    if (!window.confirm(`Email this announcement to ${recipients.length} ${recipients.length === 1 ? "member" : "members"} now?`)) return;
    setBusy("send");
    setProgress({ sent: 0, total: recipients.length });
    let sent = 0;
    let failed = 0;
    for (let i = 0; i < recipients.length; i += GROUP) {
      const result = await sendLaunchEmail("direct", subject, message, recipients.slice(i, i + GROUP), "members");
      if (!result.ok) {
        toast.error(result.error);
        failed += recipients.length - i;
        break;
      }
      sent += result.sent ?? 0;
      failed += result.failed?.length ?? 0;
      setProgress({ sent, total: recipients.length });
      // Nothing went through (daily limit or a login problem): stop rather than fail everyone.
      if (!result.sent) {
        failed += Math.max(0, recipients.length - i - GROUP);
        break;
      }
    }
    setBusy(null);
    if (sent) toast.success(`Announcement sent to ${sent} ${sent === 1 ? "member" : "members"}.`);
    if (failed) toast.error(`${failed} couldn't be sent (the free plan sends 300 a day). Try again tomorrow.`);
    if (sent && !failed) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2">
            <Megaphone className="size-5 text-primary" aria-hidden />
            Email all members
          </DialogTitle>
          <DialogDescription>
            Goes to every active account ({recipients.length} {recipients.length === 1 ? "member" : "members"}). An “Open RecipeNest” button and
            a short footer are added below your message.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 grid min-h-0 flex-1 gap-4 overflow-y-auto px-4 pb-1">
          <div className="grid gap-2">
            <Label htmlFor="members-subject">Subject</Label>
            <Input id="members-subject" value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="members-message">Message</Label>
            <Textarea id="members-message" value={message} maxLength={4000} rows={12} onChange={(e) => setMessage(e.target.value)} />
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
          <Button onClick={send} disabled={Boolean(busy) || recipients.length === 0}>
            {busy === "send" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
            Send to {recipients.length} {recipients.length === 1 ? "member" : "members"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

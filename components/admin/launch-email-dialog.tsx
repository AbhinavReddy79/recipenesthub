"use client";

import { useState } from "react";
import { Loader2, Mail, Send, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendLaunchEmail } from "@/lib/storage/waitlist";
import { cn } from "@/lib/utils";

// Written like a short personal note: emoji, "free", exclamation marks and sales
// language are what push announcement mail into spam or Promotions.
const DEFAULT_SUBJECT = "RecipeNest is open now";
const DEFAULT_MESSAGE = `Hi,

You asked us to tell you when RecipeNest opens. It's open now.

RecipeNest brings together recipes from every Indian state and kitchens around the world, with a meal planner and shopping lists in one place.

When you create your account, your first month of Premium is included, so you can publish as many recipes as you like and enter the weekly cooking contest.

If you have any questions, just reply to this email.

Thanks,
The RecipeNest team`;

const DIRECT_LIMIT = 25;
const EMAIL = /^[^@\s,;<>"]+@[^@\s,;<>"]+\.[^@\s,;<>"]+$/;

/** Splits what the admin typed (commas, spaces or new lines) into valid and invalid addresses. */
function parseEmails(text: string) {
  const parts = [...new Set(text.split(/[\s,;]+/).map((p) => p.trim().toLowerCase()).filter(Boolean))];
  return { valid: parts.filter((p) => EMAIL.test(p)), invalid: parts.filter((p) => !EMAIL.test(p)) };
}

type Audience = "waitlist" | "direct";

/**
 * Admin: send the RecipeNest invitation from the dashboard, through the owner's Gmail,
 * either to everyone on the launch waitlist or to addresses typed in by hand.
 * Nobody needs an account: the email invites them to join.
 */
export function LaunchEmailDialog({
  open,
  onOpenChange,
  waiting,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** People on the waitlist not yet emailed. */
  waiting: number;
  /** Called after each batch so the list can refresh. */
  onSent: () => void;
}) {
  const [audience, setAudience] = useState<Audience>(waiting > 0 ? "waitlist" : "direct");
  const [subject, setSubject] = useState(DEFAULT_SUBJECT);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [addresses, setAddresses] = useState("");
  const [busy, setBusy] = useState<"test" | "send" | null>(null);
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);
  const parsed = parseEmails(addresses);

  const test = async () => {
    setBusy("test");
    const result = await sendLaunchEmail("test", subject, message);
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(`Test sent to ${result.sentTo}. Check your inbox (and spam folder).`);
  };

  const finish = (sent: number, failed: number) => {
    setBusy(null);
    if (sent) toast.success(`Invitation sent to ${sent} ${sent === 1 ? "person" : "people"}.`);
    if (failed) toast.error(`${failed} couldn't be sent (Gmail sends about 500 a day). Try again tomorrow.`);
    if (sent && !failed) onOpenChange(false);
  };

  const sendWaitlist = async () => {
    if (!window.confirm(`Email ${waiting} ${waiting === 1 ? "person" : "people"} on the waitlist now? This can't be undone.`)) return;
    setBusy("send");
    let sent = 0;
    let failed = 0;
    setProgress({ sent: 0, total: waiting });
    // The function sends a batch at a time; keep going until everyone is done or a batch sends nothing.
    for (;;) {
      const result = await sendLaunchEmail("send", subject, message);
      if (!result.ok) {
        toast.error(result.error);
        break;
      }
      sent += result.sent ?? 0;
      failed += result.failed?.length ?? 0;
      setProgress({ sent, total: waiting });
      onSent();
      if (!result.remaining || !result.sent) break;
    }
    finish(sent, failed);
  };

  const sendDirect = async () => {
    const { valid, invalid } = parsed;
    if (invalid.length) return toast.error(`Check these addresses: ${invalid.slice(0, 3).join(", ")}${invalid.length > 3 ? "…" : ""}`);
    if (!valid.length) return toast.error("Enter at least one email address.");
    if (valid.length > DIRECT_LIMIT) return toast.error(`You can invite up to ${DIRECT_LIMIT} addresses at a time.`);
    if (!window.confirm(`Send the invitation to ${valid.length} ${valid.length === 1 ? "address" : "addresses"}?`)) return;
    setBusy("send");
    setProgress({ sent: 0, total: valid.length });
    const result = await sendLaunchEmail("direct", subject, message, valid);
    if (!result.ok) {
      toast.error(result.error);
      setBusy(null);
      return;
    }
    setProgress({ sent: result.sent ?? 0, total: valid.length });
    onSent();
    if (!result.failed?.length) setAddresses("");
    else setAddresses(result.failed.join("\n"));
    finish(result.sent ?? 0, result.failed?.length ?? 0);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Send the RecipeNest invitation</DialogTitle>
          <DialogDescription>
            Sent from your Gmail. Nobody needs an account: the email has a “Join RecipeNest” button. Send it after you press Launch, so the
            link works.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Send to</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <AudienceOption
                active={audience === "waitlist"}
                onClick={() => setAudience("waitlist")}
                icon={<Users />}
                title="Launch waitlist"
                detail={waiting ? `${waiting} not emailed yet` : "Nobody waiting"}
              />
              <AudienceOption
                active={audience === "direct"}
                onClick={() => setAudience("direct")}
                icon={<UserPlus />}
                title="Specific emails"
                detail="Type in addresses"
              />
            </div>
          </fieldset>

          {audience === "direct" && (
            <div className="grid gap-2">
              <Label htmlFor="invite-addresses">Email addresses</Label>
              <Textarea
                id="invite-addresses"
                value={addresses}
                rows={3}
                placeholder={"friend@example.com, cousin@example.com\none per line also works"}
                onChange={(e) => setAddresses(e.target.value)}
              />
              <p className={cn("text-xs", parsed.invalid.length ? "text-destructive" : "text-muted-foreground")}>
                {parsed.invalid.length
                  ? `Not a valid address: ${parsed.invalid.slice(0, 3).join(", ")}`
                  : `${parsed.valid.length} ${parsed.valid.length === 1 ? "address" : "addresses"} (up to ${DIRECT_LIMIT} at a time). No account is created; they're added to the waitlist as invited.`}
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="launch-subject">Subject</Label>
            <Input id="launch-subject" value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="launch-message">Message</Label>
            <Textarea id="launch-message" value={message} maxLength={4000} rows={10} onChange={(e) => setMessage(e.target.value)} />
            <p className="text-xs text-muted-foreground">A “Join RecipeNest” button and a short footer are added below your message.</p>
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
          {audience === "waitlist" ? (
            <Button onClick={sendWaitlist} disabled={Boolean(busy) || waiting === 0}>
              {busy === "send" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
              Send to {waiting} {waiting === 1 ? "person" : "people"}
            </Button>
          ) : (
            <Button onClick={sendDirect} disabled={Boolean(busy) || parsed.valid.length === 0}>
              {busy === "send" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Send data-icon="inline-start" />}
              Send invitation{parsed.valid.length > 1 ? `s (${parsed.valid.length})` : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AudienceOption({
  active,
  onClick,
  icon,
  title,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors [&_svg]:size-5",
        active ? "border-primary bg-primary/10 ring-1 ring-primary/40" : "hover:bg-muted",
      )}
    >
      <span className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")}>{icon}</span>
      <span className="grid">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </span>
    </button>
  );
}

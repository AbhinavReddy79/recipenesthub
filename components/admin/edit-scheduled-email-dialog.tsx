"use client";

import { useState } from "react";
import { BellRing, Loader2, Mail, PartyPopper, Save, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPowers } from "@/lib/storage/admin-powers";
import { updateScheduledEmail, type ScheduledEmail } from "@/lib/storage/scheduled-emails";
import { sendLaunchEmail } from "@/lib/storage/waitlist";
import { cn } from "@/lib/utils";
import { AudienceOption, DIRECT_LIMIT, parseEmails, toLocalInput, type Variant } from "./launch-email-dialog";

/**
 * Admin: change a scheduled invitation email (type, recipients, time, subject,
 * message) any time before it starts sending.
 */
export function EditScheduledEmailDialog({
  email,
  onOpenChange,
  onSaved,
}: {
  email: ScheduledEmail | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={email !== null} onOpenChange={onOpenChange}>
      {/* Keyed by the email so the form starts from that email's saved values each time. */}
      {email && <EditForm key={email.id} email={email} onClose={() => onOpenChange(false)} onSaved={onSaved} />}
    </Dialog>
  );
}

function EditForm({ email, onClose, onSaved }: { email: ScheduledEmail; onClose: () => void; onSaved: () => void }) {
  const { owner } = useAdminPowers();
  const [variant, setVariant] = useState<Variant>(email.variant === "teaser" ? "teaser" : "launch");
  const [audience, setAudience] = useState<"waitlist" | "direct">(email.audience === "direct" ? "direct" : "waitlist");
  const [addresses, setAddresses] = useState(email.emails.join("\n"));
  const [sendAt, setSendAt] = useState(toLocalInput(new Date(email.send_at)));
  const [subject, setSubject] = useState(email.subject);
  const [message, setMessage] = useState(email.message);
  const [busy, setBusy] = useState<"test" | "save" | null>(null);
  const parsed = parseEmails(addresses);

  const test = async () => {
    setBusy("test");
    const result = await sendLaunchEmail("test", subject, message, undefined, variant);
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(`Test sent to ${result.sentTo}. Check your inbox (and spam folder).`);
  };

  const save = async () => {
    const when = new Date(sendAt);
    if (Number.isNaN(when.getTime())) return toast.error("Pick a date and time.");
    if (audience === "direct") {
      if (parsed.invalid.length) return toast.error(`Check these addresses: ${parsed.invalid.slice(0, 3).join(", ")}`);
      if (!parsed.valid.length) return toast.error("Enter at least one email address.");
      if (parsed.valid.length > DIRECT_LIMIT) return toast.error(`You can schedule up to ${DIRECT_LIMIT} addresses at a time.`);
    }
    setBusy("save");
    const result = await updateScheduledEmail(email.id, { subject, message, audience, variant, emails: parsed.valid, sendAt: when });
    setBusy(null);
    if (!result.ok) return toast.error(result.error);
    toast.success(`Saved. It goes out ${when.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`);
    onSaved();
    onClose();
  };

  return (
    <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Edit scheduled email</DialogTitle>
        <DialogDescription>Change anything until it starts sending. Saving keeps it scheduled.</DialogDescription>
      </DialogHeader>
      {/* Only the middle scrolls, so the title and the buttons always stay on screen. */}
      <div className="-mx-4 grid min-h-0 flex-1 gap-4 overflow-y-auto px-4 pb-1">
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Email type</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <AudienceOption
              active={variant === "teaser"}
              onClick={() => setVariant("teaser")}
              icon={<BellRing />}
              title="Pre-launch teaser"
              detail="Button: “Get notified at launch”"
            />
            <AudienceOption
              active={variant === "launch"}
              onClick={() => setVariant("launch")}
              disabled={!owner}
              icon={<PartyPopper />}
              title="Launch invitation"
              detail={owner ? "Button: “Join RecipeNest”" : "Owner only"}
            />
          </div>
        </fieldset>

        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Send to</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            <AudienceOption
              active={audience === "waitlist"}
              onClick={() => setAudience("waitlist")}
              icon={<Users />}
              title="Launch waitlist"
              detail="Everyone on it at send time"
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
            <Label htmlFor="edit-addresses">Email addresses</Label>
            <Textarea id="edit-addresses" value={addresses} rows={3} onChange={(e) => setAddresses(e.target.value)} />
            <p className={cn("text-xs", parsed.invalid.length ? "text-destructive" : "text-muted-foreground")}>
              {parsed.invalid.length
                ? `Not a valid address: ${parsed.invalid.slice(0, 3).join(", ")}`
                : `${parsed.valid.length} ${parsed.valid.length === 1 ? "address" : "addresses"} (up to ${DIRECT_LIMIT}).`}
            </p>
          </div>
        )}

        <div className="grid gap-1.5">
          <Label htmlFor="edit-send-at">Send on</Label>
          <Input id="edit-send-at" type="datetime-local" value={sendAt} onChange={(e) => setSendAt(e.target.value)} />
          <p className="text-xs text-muted-foreground">Your local time. It goes out within a minute of this time.</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="edit-subject">Subject</Label>
          <Input id="edit-subject" value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="edit-message">Message</Label>
          <Textarea id="edit-message" value={message} maxLength={4000} rows={10} onChange={(e) => setMessage(e.target.value)} />
        </div>
      </div>
      <DialogFooter className="gap-2 sm:justify-between">
        <Button variant="outline" onClick={test} disabled={Boolean(busy)}>
          {busy === "test" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Mail data-icon="inline-start" />}
          Send a test to me
        </Button>
        <Button onClick={save} disabled={Boolean(busy) || (audience === "direct" && parsed.valid.length === 0)}>
          {busy === "save" ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Save data-icon="inline-start" />}
          Save changes
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

"use client";

import { useState } from "react";
import { Loader2, MailPlus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/use-current-user";
import { accountsStorage } from "@/lib/storage/accounts";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Admins: invite someone by email. They get a link to choose their own password. */
export function AddUserDialog() {
  const { isAdmin } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  if (!isAdmin) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return setError("Please enter their name.");
    if (!EMAIL.test(email.trim())) return setError("Please enter a valid email address.");
    setError(null);
    setSending(true);
    const result = await accountsStorage.invite(name.trim(), email.trim());
    setSending(false);
    if (!result.ok) return setError(result.error);
    toast.success(`Invite sent to ${email.trim()}`);
    setOpen(false);
    setName("");
    setEmail("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus data-icon="inline-start" />
          Add user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Invite someone to RecipeNest</DialogTitle>
            <DialogDescription>
              They&apos;ll get an email with a link to choose their password. Their account appears in this list straight away.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="invite-name">Name</Label>
            <Input id="invite-name" autoComplete="off" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={sending}>
              {sending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <MailPlus data-icon="inline-start" />}
              Send invite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

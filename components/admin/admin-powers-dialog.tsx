"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ADMIN_POWER_LABELS, ownerSetAdminPowers, type AdminPower, type MemberPowers } from "@/lib/storage/admin-powers";
import type { UserProfile } from "@/types/user";

const ORDER: AdminPower[] = ["moderate", "members", "contests", "messages"];
export const DEFAULT_POWERS: MemberPowers = { moderate: true, members: false, contests: false, messages: false };

/** Owner only: choose what one admin may do. */
export function AdminPowersDialog({
  admin,
  powers,
  onClose,
  onSaved,
}: {
  admin: UserProfile | null;
  powers: MemberPowers | undefined;
  onClose: () => void;
  onSaved: () => void;
}) {
  return (
    <Dialog open={admin !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {admin && <PowersForm key={admin.id} admin={admin} initial={powers ?? DEFAULT_POWERS} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function PowersForm({
  admin,
  initial,
  onClose,
  onSaved,
}: {
  admin: UserProfile;
  initial: MemberPowers;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState<MemberPowers>(initial);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const ok = await ownerSetAdminPowers(admin.id, value);
    setSaving(false);
    if (!ok) return toast.error("We couldn't save those permissions. Please try again.");
    toast.success(`Updated what ${admin.name} can do`);
    onSaved();
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>What can {admin.name} do?</DialogTitle>
        <DialogDescription>
          Only you can make admins, give early access, change these permissions and mark contest prizes as paid.
        </DialogDescription>
      </DialogHeader>
      <ul className="grid gap-3">
        {ORDER.map((power) => (
          <li key={power}>
            <label className="flex items-start justify-between gap-4 rounded-xl border p-3">
              <span className="grid gap-0.5">
                <span className="text-sm font-semibold">{ADMIN_POWER_LABELS[power].label}</span>
                <span className="text-xs text-muted-foreground">{ADMIN_POWER_LABELS[power].description}</span>
              </span>
              <Switch checked={value[power]} onCheckedChange={(on) => setValue((v) => ({ ...v, [power]: on }))} />
            </label>
          </li>
        ))}
      </ul>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="animate-spin" data-icon="inline-start" />}
          Save permissions
        </Button>
      </DialogFooter>
    </>
  );
}

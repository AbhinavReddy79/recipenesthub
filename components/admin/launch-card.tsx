"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Loader2, Rocket, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LAUNCH_AT } from "@/lib/launch";
import { useAdminPowers } from "@/lib/storage/admin-powers";
import { userContext } from "@/lib/storage/remote";

const formatDay = (date: Date) =>
  new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }).format(date);
const formatMoment = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(iso));

/** Owner only: open RecipeNest to everyone (or go back to the countdown). */
export function LaunchCard() {
  const { owner } = useAdminPowers();
  const [launchedAt, setLaunchedAt] = useState<string | null | undefined>(undefined);
  const [confirm, setConfirm] = useState<"launch" | "undo" | null>(null);
  const [busy, setBusy] = useState(false);
  // Read when the button is pressed (not while rendering).
  const [beforePlannedDate, setBeforePlannedDate] = useState(false);

  useEffect(() => {
    if (!owner) return;
    const ctx = userContext();
    if (!ctx) return;
    let cancelled = false;
    void ctx.supabase.rpc("owner_site_status").then(({ data, error }) => {
      if (!cancelled && !error) setLaunchedAt(data ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [owner]);

  if (!owner || launchedAt === undefined) return null;

  const setLaunched = async (launched: boolean) => {
    const ctx = userContext();
    if (!ctx) return;
    setBusy(true);
    const { data, error } = await ctx.supabase.rpc("owner_set_launched", { launched });
    setBusy(false);
    setConfirm(null);
    if (error) return toast.error("That didn't work. Please try again.");
    setLaunchedAt(data ?? null);
    toast.success(launched ? "🚀 RecipeNest is live! Everyone can now join. Next: “Send invitations” in the Launch waitlist card below." : "Back to the countdown. Only you and early-access members can get in.");
  };

  const live = Boolean(launchedAt);

  return (
    <section
      aria-labelledby="launch-heading"
      className="dark relative isolate overflow-hidden rounded-2xl bg-metallic-charcoal p-5 text-white shadow-lift ring-2 ring-saffron/50 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-metallic-gold text-[oklch(0.2_0.006_70)]">
            <Rocket className="size-6" aria-hidden />
          </span>
          <div className="grid gap-0.5">
            <h2 id="launch-heading" className="font-display text-xl font-semibold">
              {live ? "RecipeNest is live" : "Ready to launch?"}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-white/75">
              <CalendarDays className="size-4 text-gold-light" aria-hidden />
              {live
                ? `Opened to everyone on ${formatMoment(launchedAt as string)}`
                : `Countdown shows ${formatDay(LAUNCH_AT)}. Only you and early-access members can get in until you launch.`}
            </p>
          </div>
        </div>
        {live ? (
          <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setConfirm("undo")}>
            <RotateCcw data-icon="inline-start" />
            Undo launch
          </Button>
        ) : (
          <Button size="lg" className="bg-metallic-gold text-[oklch(0.2_0.006_70)] hover:opacity-95" onClick={() => {
              setBeforePlannedDate(Date.now() < LAUNCH_AT.getTime());
              setConfirm("launch");
            }}>
            <Rocket data-icon="inline-start" />
            Launch RecipeNest
          </Button>
        )}
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "launch" ? "Open RecipeNest to everyone?" : "Go back to the countdown?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "launch"
                ? `The countdown disappears and anyone can create an account and use the site within about 15 seconds. People waiting on the countdown page are taken in automatically. Scheduled launch emails go out right away.${
                    beforePlannedDate ? " This is before the date on the countdown." : ""
                  }`
                : "Everyone except you and early-access members will see the countdown again within about 15 seconds. Accounts and data are kept."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              variant={confirm === "undo" ? "destructive" : undefined}
              onClick={(event) => {
                event.preventDefault();
                void setLaunched(confirm === "launch");
              }}
            >
              {busy && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {confirm === "launch" ? "Launch now" : "Undo launch"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

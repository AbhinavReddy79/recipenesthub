"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, MoreHorizontal, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/empty-state";
import { ListSkeleton } from "@/components/shared/skeletons";
import { UserAvatar } from "@/components/shared/user-avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccounts, useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useUserRecipes } from "@/hooks/use-user-recipes";
import { formatDate } from "@/lib/format";
import { adminListPlans, adminSetPremium, type MemberPlan } from "@/lib/storage/plan";
import { adminListEarlyAccess, adminListPresence, isOnline, setEarlyAccess } from "@/lib/storage/presence";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/user";
import { ownerListAdminPowers, type MemberPowers } from "@/lib/storage/admin-powers";
import { AdminPowersDialog } from "./admin-powers-dialog";
import { AdminToolbar } from "./admin-toolbar";

/**
 * Every registered account. Suspending one blocks its login; deleting removes it
 * and its data. Only the site owner can make other people admins. The database
 * enforces all of these rules; the menu just hides what you aren't allowed to do.
 */
export function AdminUsersTable() {
  const hydrated = useHydrated();
  const { user: me } = useCurrentUser();
  const { accounts, isOwner, setStatus, setRole, remove } = useAccounts();
  const [granting, setGranting] = useState<UserProfile | null>(null);
  const { all } = useUserRecipes();
  const [search, setSearch] = useState("");
  const [status, setStatusFilter] = useState("all");
  const [deleting, setDeleting] = useState<UserProfile | null>(null);
  const [disabling, setDisabling] = useState<UserProfile | null>(null);
  const [plans, setPlans] = useState<Record<string, MemberPlan>>({});
  // Last activity per member, refreshed every 30 seconds (green dot = active in the last 2 minutes).
  const [presence, setPresence] = useState<{ lastSeen: Record<string, string>; at: number }>({ lastSeen: {}, at: 0 });
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      adminListPresence()
        .then((lastSeen) => !cancelled && setPresence({ lastSeen, at: Date.now() }))
        .catch(() => {});
    load();
    const id = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);
  // Owner only: what each admin may do.
  const [adminPowers, setAdminPowers] = useState<Record<string, MemberPowers>>({});
  const [editingPowers, setEditingPowers] = useState<UserProfile | null>(null);
  const loadAdminPowers = useCallback(() => {
    if (!isOwner) return;
    ownerListAdminPowers()
      .then(setAdminPowers)
      .catch(() => {});
  }, [isOwner]);
  useEffect(loadAdminPowers, [loadAdminPowers, accounts]);

  // Before launch: who may use the site besides the owner.
  const [earlyAccess, setEarlyAccessIds] = useState<Set<string>>(new Set());
  const loadEarlyAccess = useCallback(() => {
    adminListEarlyAccess()
      .then(setEarlyAccessIds)
      .catch(() => {});
  }, []);
  useEffect(loadEarlyAccess, [loadEarlyAccess]);
  const toggleEarlyAccess = async (user: UserProfile, allowed: boolean) => {
    if (!(await setEarlyAccess(user.id, allowed))) return toast.error("Only the site owner can change early access.");
    toast.success(allowed ? `${user.name} can now use RecipeNest before launch` : `${user.name} will see the countdown until launch`);
    loadEarlyAccess();
  };
  const onlineCount = Object.values(presence.lastSeen).filter((seen) => isOnline(seen, presence.at)).length;

  const loadPlans = useCallback(() => {
    adminListPlans()
      .then(setPlans)
      .catch(() => {});
  }, []);
  useEffect(loadPlans, [loadPlans]);

  const givePremium = async (user: UserProfile, days: number) => {
    const ok = await adminSetPremium(user.id, days);
    if (!ok) return toast.error("We couldn't change that plan. Please try again.");
    toast.success(days === 0 ? `${user.name} is back on the Free plan` : `Gave ${user.name} ${days === 365 ? "a year" : "a month"} of Premium`);
    loadPlans();
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter(
      (u) =>
        (status === "all" || u.status === status) &&
        (!q || u.name.toLowerCase().includes(q) || u.username.includes(q) || u.email.includes(q)),
    );
  }, [accounts, search, status]);

  if (!hydrated) return <ListSkeleton rows={6} />;

  if (accounts.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No users yet"
        description="RecipeNest just launched. Profiles appear here as soon as people sign up."
      />
    );
  }

  const recipeCount = (id: string) => all.filter((r) => r.authorId === id).length;

  return (
    <div className="grid gap-5">
      <AdminToolbar
        search={search}
        onSearch={setSearch}
        placeholder="Search by name, username or email"
        resultCount={visible.length}
        noun="user"
        filters={[
          {
            label: "Filter by status",
            value: status,
            onChange: setStatusFilter,
            options: [
              { value: "all", label: "All accounts" },
              { value: "active", label: "Enabled" },
              { value: "suspended", label: "Disabled" },
            ],
          },
        ]}
      />
      <p className="flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        <span className="size-2.5 rounded-full bg-herb shadow-[0_0_0_3px_color-mix(in_oklch,var(--herb)_25%,transparent)]" aria-hidden />
        {onlineCount} {onlineCount === 1 ? "person" : "people"} using RecipeNest right now
      </p>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader className="bg-surface">
            <TableRow>
              <TableHead className="pl-4">User</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Account</TableHead>
              {isOwner && <TableHead>Admin</TableHead>}
              <TableHead className="hidden sm:table-cell">Plan</TableHead>
              <TableHead className="hidden sm:table-cell">Recipes</TableHead>
              <TableHead className="hidden lg:table-cell">Joined</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={isOwner ? 8 : 7} className="py-12 text-center text-muted-foreground">
                  No users match these filters.
                </TableCell>
              </TableRow>
            )}
            {visible.map((user) => {
              // You and the owner can't be switched off; only the owner manages admins.
              const locked = user.isOwner || user.id === me?.id;
              const canChangeRole = isOwner && !locked;
              const canModerate = !locked && (user.role !== "admin" || isOwner);
              const enabled = user.status === "active";
              return (
                <TableRow key={user.id}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <PresenceAvatar user={user} lastSeen={presence.lastSeen[user.id]} now={presence.at} />
                      <div className="grid">
                        <span className="flex items-center gap-1.5 font-medium">
                          {user.name}
                          {user.isOwner ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-metallic-gold px-2 py-px text-[0.6875rem] font-semibold text-[oklch(0.2_0.006_70)]">
                              <Crown className="size-3" aria-hidden />
                              Owner
                            </span>
                          ) : user.role === "admin" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-px text-[0.6875rem] font-semibold text-background">
                              <ShieldCheck className="size-3" aria-hidden />
                              Admin
                            </span>
                          ) : null}
                          {user.id === me?.id && <span className="text-xs font-normal text-muted-foreground">(you)</span>}
                          {earlyAccess.has(user.id) && (
                            <span className="rounded-full bg-herb-soft px-2 py-px text-[0.6875rem] font-semibold text-herb">Early access</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          @{user.username} ·{" "}
                          <span className={isOnline(presence.lastSeen[user.id], presence.at) ? "font-medium text-herb" : undefined}>
                            {lastSeenLabel(presence.lastSeen[user.id], presence.at)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{user.email}</TableCell>
                  <TableCell>
                    <label
                      className="flex w-fit items-center gap-2.5"
                      title={canModerate ? undefined : "This account can't be disabled by you"}
                    >
                      <Switch
                        checked={enabled}
                        disabled={!canModerate}
                        aria-label={`${enabled ? "Disable" : "Enable"} ${user.name}'s account`}
                        onCheckedChange={(on) => {
                          if (on) {
                            setStatus(user.id, "active");
                            toast.success(`Enabled ${user.name} — they can log in again`);
                          } else {
                            setDisabling(user);
                          }
                        }}
                      />
                      <span className={cn("text-sm font-medium", enabled ? "text-herb" : "text-destructive")}>
                        {enabled ? "Enabled" : "Disabled"}
                      </span>
                    </label>
                  </TableCell>
                  {isOwner && (
                    <TableCell>
                      <Switch
                        checked={user.role === "admin"}
                        disabled={!canChangeRole}
                        title={canChangeRole ? undefined : "Your own admin access can't be changed"}
                        aria-label={`${user.role === "admin" ? "Remove" : "Give"} admin access for ${user.name}`}
                        onCheckedChange={(on) => {
                          if (on) {
                            setGranting(user);
                          } else {
                            setRole(user.id, "user");
                            toast.success(`${user.name} is no longer an admin`);
                          }
                        }}
                      />
                    </TableCell>
                  )}
                  <TableCell className="hidden sm:table-cell">
                    {plans[user.id]?.premium ? (
                      <span className="grid">
                        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-metallic-gold px-2 py-px text-[0.6875rem] font-semibold text-[oklch(0.2_0.006_70)]">
                          <Crown className="size-3" aria-hidden />
                          Premium
                        </span>
                        {plans[user.id]?.premiumUntil && (
                          <span className="text-xs text-muted-foreground">until {formatDate(plans[user.id]!.premiumUntil!)}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Free</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden tabular-nums sm:table-cell">{recipeCount(user.id)}</TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="pr-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${user.name}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {isOwner && !user.isOwner && user.role === "admin" && (
                          <DropdownMenuItem onSelect={() => setEditingPowers(user)}>
                            <ShieldCheck />
                            Admin permissions…
                          </DropdownMenuItem>
                        )}
                        {isOwner && !user.isOwner && (
                          <DropdownMenuItem onSelect={() => toggleEarlyAccess(user, !earlyAccess.has(user.id))}>
                            <ShieldCheck />
                            {earlyAccess.has(user.id) ? "Remove early access" : "Give early access (before launch)"}
                          </DropdownMenuItem>
                        )}
                        {/* For members who pay another way (e.g. UPI), prizes or testing. */}
                        <DropdownMenuItem onSelect={() => givePremium(user, 30)}>
                          <Crown />
                          Give 1 month Premium
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => givePremium(user, 365)}>
                          <Crown />
                          Give 1 year Premium
                        </DropdownMenuItem>
                        {plans[user.id]?.premium && (
                          <DropdownMenuItem onSelect={() => givePremium(user, 0)}>
                            <Crown />
                            Remove Premium
                          </DropdownMenuItem>
                        )}
                        {canModerate && (
                          <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(user)}>
                            <Trash2 />
                            Delete user
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AdminPowersDialog
        admin={editingPowers}
        powers={editingPowers ? adminPowers[editingPowers.id] : undefined}
        onClose={() => setEditingPowers(null)}
        onSaved={loadAdminPowers}
      />

      <AlertDialog open={disabling !== null} onOpenChange={(open) => !open && setDisabling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable {disabling?.name}&apos;s account?</AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll be signed out and can&apos;t log in, post recipes or write reviews until you enable them again.
              Their recipes and data are kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!disabling) return;
                setStatus(disabling.id, "suspended");
                toast.success(`Disabled ${disabling.name}'s account`);
              }}
            >
              Disable account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={granting !== null} onOpenChange={(open) => !open && setGranting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make {granting?.name} an admin?</AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll be able to open the admin console and moderate recipes and reviews. Managing members, contests
              and Contact messages stay off until you switch them on in their admin permissions. Only you can give or
              remove admin access, and admins can never change your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!granting) return;
                setRole(granting.id, "admin");
                toast.success(`${granting.name} is now an admin`);
                // Straight on to choosing what they may do.
                setEditingPowers(granting);
              }}
            >
              Make admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Their account, sign-in, recipes and personal data will be permanently deleted. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                remove(deleting.id);
                toast(`Deleted ${deleting.name}`);
              }}
            >
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function lastSeenLabel(lastSeen: string | undefined, now: number): string {
  if (!lastSeen || !now) return "Not seen yet";
  if (isOnline(lastSeen, now)) return "Using RecipeNest now";
  const minutes = Math.round((Date.parse(lastSeen) - now) / 60_000);
  if (minutes > -60) return `Last seen ${relative.format(minutes, "minute")}`;
  const hours = Math.round(minutes / 60);
  if (hours > -24) return `Last seen ${relative.format(hours, "hour")}`;
  return `Last seen ${relative.format(Math.round(hours / 24), "day")}`;
}

/** Avatar with a green (using the site now) or red (not using it) status dot. */
function PresenceAvatar({ user, lastSeen, now }: { user: UserProfile; lastSeen: string | undefined; now: number }) {
  const online = isOnline(lastSeen, now);
  const label = lastSeenLabel(lastSeen, now);
  return (
    <span className="relative shrink-0" title={label}>
      <UserAvatar name={user.name} src={user.avatar} className="size-9" />
      <span
        aria-hidden
        className={cn(
          "absolute -right-0.5 -bottom-0.5 size-3 rounded-full ring-2 ring-card",
          online ? "bg-herb" : "bg-destructive",
          online && "animate-pulse",
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

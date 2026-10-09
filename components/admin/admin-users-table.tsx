"use client";

import { useMemo, useState } from "react";
import { Ban, Crown, MoreHorizontal, RotateCcw, ShieldCheck, ShieldOff, Trash2, Users } from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAccounts, useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { useUserRecipes } from "@/hooks/use-user-recipes";
import { formatDate } from "@/lib/format";
import type { UserProfile } from "@/types/user";
import { AdminToolbar } from "./admin-toolbar";
import { StatusBadge } from "./status-badge";

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
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ],
          },
        ]}
      />
      <div className="overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader className="bg-surface">
            <TableRow>
              <TableHead className="pl-4">User</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead>Status</TableHead>
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
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No users match these filters.
                </TableCell>
              </TableRow>
            )}
            {visible.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={user.name} src={user.avatar} className="size-9" />
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
                      </span>
                      <span className="text-xs text-muted-foreground">@{user.username}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{user.email}</TableCell>
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>
                <TableCell className="hidden tabular-nums sm:table-cell">{recipeCount(user.id)}</TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{formatDate(user.createdAt)}</TableCell>
                <TableCell className="pr-4">
                  {(() => {
                    const locked = user.isOwner || user.id === me?.id;
                    const canChangeRole = isOwner && !locked;
                    const canModerate = !locked && (user.role !== "admin" || isOwner);
                    if (!canChangeRole && !canModerate) return <span className="sr-only">No actions</span>;
                    return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${user.name}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canChangeRole &&
                            (user.role === "admin" ? (
                              <DropdownMenuItem
                                onSelect={() => {
                                  setRole(user.id, "user");
                                  toast.success(`${user.name} is no longer an admin`);
                                }}
                              >
                                <ShieldOff />
                                Remove admin access
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onSelect={() => setGranting(user)}>
                                <ShieldCheck />
                                Make admin
                              </DropdownMenuItem>
                            ))}
                          {canChangeRole && canModerate && <DropdownMenuSeparator />}
                          {canModerate &&
                            (user.status === "suspended" ? (
                              <DropdownMenuItem
                                onSelect={() => {
                                  setStatus(user.id, "active");
                                  toast.success(`Reactivated ${user.name}`);
                                }}
                              >
                                <RotateCcw />
                                Reactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onSelect={() => {
                                  setStatus(user.id, "suspended");
                                  toast.success(`Suspended ${user.name} — they can't log in until reactivated`);
                                }}
                              >
                                <Ban />
                                Suspend
                              </DropdownMenuItem>
                            ))}
                          {canModerate && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(user)}>
                                <Trash2 />
                                Delete user
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={granting !== null} onOpenChange={(open) => !open && setGranting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make {granting?.name} an admin?</AlertDialogTitle>
            <AlertDialogDescription>
              They&apos;ll be able to open the admin console, moderate recipes, and suspend or delete regular users.
              Only you, as the owner, can give or remove admin access, and admins can never change your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!granting) return;
                setRole(granting.id, "admin");
                toast.success(`${granting.name} is now an admin`);
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

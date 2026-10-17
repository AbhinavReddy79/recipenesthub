import { useEffect } from "react";
import { createMemoryStore, useStore } from "./core";
import { authStore } from "./session";
import { userContext } from "./remote";

export type AdminPower = "moderate" | "members" | "contests" | "messages";

export interface AdminPowers {
  loaded: boolean;
  owner: boolean;
  moderate: boolean;
  members: boolean;
  contests: boolean;
  messages: boolean;
}

export const ADMIN_POWER_LABELS: Record<AdminPower, { label: string; description: string }> = {
  moderate: { label: "Moderate recipes & reviews", description: "Hide, publish or delete community recipes; edit or delete reviews." },
  members: {
    label: "Manage members & invitations",
    description:
      "See the users list, disable or delete members, give Premium and add users. Manage the launch waitlist, and send, schedule, edit or cancel pre-launch teaser emails. Only you send or change the launch invitation and clear the email history.",
  },
  contests: {
    label: "Manage contests & lucky draws",
    description:
      "Create contests and lucky draws, remove entries, announce and draw winners (winners then show on the contest page, and their details are emailed to you). Only you mark cash prizes as paid.",
  },
  messages: {
    label: "Contact messages & replies",
    description: "Read Contact page messages, reply to members and guests from the inbox, and delete messages.",
  },
};

const NONE: AdminPowers = { loaded: false, owner: false, moderate: false, members: false, contests: false, messages: false };

/** What the signed-in admin may do in the console (the database enforces the same rules). */
export const adminPowersStore = createMemoryStore<AdminPowers>(NONE);
let loadedFor: string | null = null;

async function loadPowers(userId: string): Promise<void> {
  const ctx = userContext();
  if (!ctx) return;
  const { data, error } = await ctx.supabase.rpc("my_admin_powers").maybeSingle();
  if (error || !data) {
    adminPowersStore.set({ ...NONE, loaded: true });
    return;
  }
  if (authStore.get().user?.id !== userId) return;
  adminPowersStore.set({ loaded: true, ...data });
}

/** Loads the signed-in admin's powers once per sign-in. */
export function useAdminPowers(): AdminPowers {
  const powers = useStore(adminPowersStore);
  const user = useStore(authStore).user;
  const isAdmin = user?.role === "admin" && user.status === "active";
  useEffect(() => {
    if (!user || !isAdmin) {
      loadedFor = null;
      return;
    }
    if (loadedFor === user.id) return;
    loadedFor = user.id;
    void loadPowers(user.id);
  }, [user, isAdmin]);
  return powers;
}

/* ---------- Owner ---------- */

export type MemberPowers = Record<AdminPower, boolean>;

/** Owner only: every admin's powers, keyed by user id. */
export async function ownerListAdminPowers(): Promise<Record<string, MemberPowers>> {
  const ctx = userContext();
  if (!ctx) return {};
  const { data, error } = await ctx.supabase.rpc("owner_list_admin_powers");
  if (error) throw error;
  return Object.fromEntries(
    (data ?? []).map((r) => [r.user_id, { moderate: r.moderate, members: r.members, contests: r.contests, messages: r.messages }]),
  );
}

/** Owner only: set what an admin may do. */
export async function ownerSetAdminPowers(userId: string, powers: MemberPowers): Promise<boolean> {
  const ctx = userContext();
  if (!ctx) return false;
  const { error } = await ctx.supabase.rpc("set_admin_powers", {
    target: userId,
    p_moderate: powers.moderate,
    p_members: powers.members,
    p_contests: powers.contests,
    p_messages: powers.messages,
  });
  return !error;
}

import type { Database } from "@/lib/supabase/database.types";
import type { RecipeNestClient } from "@/lib/supabase/client";
import { BUCKETS } from "@/lib/supabase/env";
import type { UserProfile } from "@/types/user";
import { createMemoryStore } from "./core";
import { isDataUrl, reportError, safeImageUrl, uploadImage, userContext } from "./remote";
import { setCurrentProfile } from "./session";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** Columns safe to read for anyone's profile. */
export const PUBLIC_PROFILE_COLUMNS = "id, username, name, avatar_url, bio, location, role, status, created_at";

export function toProfile(
  row: Pick<ProfileRow, "id" | "username" | "name" | "avatar_url" | "bio" | "location" | "role" | "status" | "created_at">,
  email = "",
): UserProfile {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email,
    avatar: safeImageUrl(row.avatar_url, BUCKETS.avatars),
    bio: row.bio,
    location: row.location,
    createdAt: row.created_at,
    status: row.status,
    role: row.role,
  };
}

export async function fetchProfile(supabase: RecipeNestClient, userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

export type AccountResult =
  | { ok: true; profile: UserProfile; pendingEmailConfirmation?: boolean }
  | { ok: false; field?: "email" | "username" | "password"; error: string };

/** Every account, with emails (admin console only; filled by admin_list_users). */
export const accountsStore = createMemoryStore<UserProfile[]>([]);

const USERNAME_TAKEN = "That username is taken. Try another.";

export const accountsStorage = {
  /** Updates the signed-in user's profile; a newly picked photo is uploaded to Storage first. */
  async updateProfile(
    id: string,
    patch: Partial<Pick<UserProfile, "name" | "username" | "avatar" | "bio" | "location">>,
  ): Promise<AccountResult> {
    const ctx = userContext();
    if (!ctx || ctx.userId !== id) return { ok: false, error: "Please log in again to update your profile." };
    const { supabase, userId } = ctx;

    const update: Database["public"]["Tables"]["profiles"]["Update"] = {};
    if (patch.name !== undefined) update.name = patch.name.trim();
    if (patch.bio !== undefined) update.bio = patch.bio.trim();
    if (patch.location !== undefined) update.location = patch.location.trim();
    if (patch.username !== undefined) {
      const username = patch.username.trim().toLowerCase();
      const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).neq("id", userId).maybeSingle();
      if (taken) return { ok: false, field: "username", error: USERNAME_TAKEN };
      update.username = username;
    }
    if (patch.avatar !== undefined) {
      try {
        update.avatar_url = isDataUrl(patch.avatar)
          ? await uploadImage(supabase, BUCKETS.avatars, `${userId}/avatar-${Date.now()}.jpg`, patch.avatar)
          : patch.avatar;
      } catch (error) {
        console.error(error);
        return { ok: false, error: "We couldn't upload that photo. Try a smaller JPG or PNG." };
      }
    }

    const { data, error } = await supabase.from("profiles").update(update).eq("id", userId).select("*").single();
    if (error) {
      if (error.code === "23505") return { ok: false, field: "username", error: USERNAME_TAKEN };
      console.error(error);
      return { ok: false, error: "We couldn't save your profile. Please try again." };
    }
    let email = "";
    setCurrentProfile((current) => {
      email = current.email;
      return toProfile(data, current.email);
    });
    return { ok: true, profile: toProfile(data, email) };
  },

  /* ---------- Admin console ---------- */

  /**
   * Admins: emails someone an invitation to join. Runs in the admin-invite-user
   * Edge Function, which checks the caller is an active admin; the new account
   * appears in the list once the invite is sent.
   */
  async invite(name: string, email: string): Promise<{ ok: true } | { ok: false; error: string }> {
    const ctx = userContext();
    if (!ctx) return { ok: false, error: "Please log in again." };
    const { data, error } = await ctx.supabase.functions.invoke<{ ok?: boolean; error?: string }>("admin-invite-user", {
      body: { name, email },
    });
    // Errors from the function arrive with its JSON body in the response context.
    let code = data?.error;
    if (error && "context" in error && error.context instanceof Response) {
      code = ((await error.context.json().catch(() => ({}))) as { error?: string }).error;
    }
    if (!error && data?.ok) {
      void accountsStorage.loadAll();
      return { ok: true };
    }
    const messages: Record<string, string> = {
      already_registered: "Someone with that email already has an account.",
      rate_limited: "Too many emails were sent recently. Please try again in an hour.",
      invalid_email: "Please enter a valid email address.",
      invalid_name: "Please enter their name.",
      not_admin: "Only active admins can invite people.",
      signed_out: "Please log in again.",
    };
    if (!code) console.error("invite failed", error);
    return { ok: false, error: messages[code ?? ""] ?? "We couldn't send the invite. Please try again." };
  },

  async loadAll(): Promise<void> {
    const ctx = userContext();
    if (!ctx) return;
    const { data, error } = await ctx.supabase.rpc("admin_list_users");
    if (error) return reportError("load accounts", error);
    accountsStore.set((data ?? []).map((row) => ({ ...toProfile(row, row.email), isOwner: row.is_owner })));
  },

  setStatus(id: string, status: UserProfile["status"]): void {
    const ctx = userContext();
    if (!ctx) return;
    accountsStore.set((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    void ctx.supabase
      .from("profiles")
      .update({ status })
      .eq("id", id)
      .then(({ error }) => {
        if (!error) return;
        reportError("update that account", error);
        void accountsStorage.loadAll();
      });
  },

  /** Owner only: give someone admin access or take it away (the database enforces who may). */
  setRole(id: string, role: UserProfile["role"]): void {
    const ctx = userContext();
    if (!ctx) return;
    accountsStore.set((prev) => prev.map((a) => (a.id === id ? { ...a, role } : a)));
    void ctx.supabase
      .from("profiles")
      .update({ role })
      .eq("id", id)
      .then(({ error }) => {
        if (!error) return;
        reportError("change that account's access", error);
        void accountsStorage.loadAll();
      });
  },

  /** Permanently deletes another account and everything it owns. */
  remove(id: string): void {
    const ctx = userContext();
    if (!ctx) return;
    accountsStore.set((prev) => prev.filter((a) => a.id !== id));
    void ctx.supabase.rpc("admin_delete_user", { target: id }).then(({ error }) => {
      if (!error) return;
      reportError("delete that account", error);
      void accountsStorage.loadAll();
    });
  },
};

/**
 * Sign-in for RecipeNest, backed by Supabase Auth (email + password, with
 * email confirmation). The forms and dialogs only talk to this module.
 */
import { clearLocalData } from "@/lib/storage/core";
import { fetchProfile, toProfile, type AccountResult } from "@/lib/storage/accounts";
import { removeUserImages } from "@/lib/storage/remote";
import { getActiveUserId } from "@/lib/storage/session";
import { rememberSignIn, stashPendingAvatar } from "@/lib/storage/sync";
import { getSupabase } from "@/lib/supabase/client";

export type AuthResult = AccountResult;
export type SimpleResult = { ok: true } | { ok: false; error: string };

const NOT_CONFIGURED = "Accounts aren't available right now. Please try again later.";

/** Where links in auth emails (confirmation, password reset) should land. */
const callbackUrl = (next: string) => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

export const authClient = {
  async signIn(credentials: { email: string; password: string; remember: boolean }): Promise<AuthResult> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email.trim(),
      password: credentials.password,
    });
    if (error) {
      if (error.code === "email_not_confirmed") {
        return { ok: false, field: "email", error: "Please confirm your email first — check your inbox for the link we sent." };
      }
      if (error.code === "invalid_credentials") {
        return { ok: false, field: "password", error: "That email and password don't match. Try again." };
      }
      return { ok: false, error: error.message };
    }
    const row = await fetchProfile(supabase, data.user.id).catch(() => null);
    if (row?.status === "suspended") {
      await supabase.auth.signOut();
      return { ok: false, error: "This account has been suspended." };
    }
    rememberSignIn(credentials.remember);
    return row
      ? { ok: true, profile: toProfile(row, data.user.email ?? "") }
      : { ok: false, error: "We couldn't load your profile. Please try again." };
  },

  async signUp(input: {
    name: string;
    username: string;
    email: string;
    password: string;
    avatar: string;
    bio: string;
  }): Promise<AuthResult> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };
    const username = input.username.trim().toLowerCase();
    const email = input.email.trim().toLowerCase();

    const { data: taken } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
    if (taken) return { ok: false, field: "username", error: "That username is taken. Try another." };

    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: {
        data: { name: input.name.trim(), username, bio: input.bio.trim() },
        emailRedirectTo: callbackUrl("/profile"),
      },
    });
    if (error) {
      if (error.code === "user_already_exists" || error.code === "email_exists") {
        return { ok: false, field: "email", error: "An account with this email already exists. Log in instead." };
      }
      if (error.code === "weak_password") return { ok: false, field: "password", error: error.message };
      if (error.message.toLowerCase().includes("database error")) {
        return { ok: false, field: "username", error: "That username is taken. Try another." };
      }
      return { ok: false, error: error.message };
    }
    // With email confirmation on, an existing address comes back as a user with no identities.
    if (data.user && data.user.identities?.length === 0) {
      return { ok: false, field: "email", error: "An account with this email already exists. Log in instead." };
    }
    if (input.avatar) stashPendingAvatar(email, input.avatar);
    if (data.session) rememberSignIn(true);

    return {
      ok: true,
      pendingEmailConfirmation: !data.session,
      profile: {
        id: data.user?.id ?? "",
        name: input.name.trim(),
        username,
        email,
        avatar: "",
        bio: input.bio.trim(),
        location: "",
        createdAt: new Date().toISOString(),
        status: "active",
        role: "user",
      },
    };
  },

  /** Emails a reset link that opens /reset-password signed in. */
  async requestPasswordReset(email: string): Promise<SimpleResult> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: callbackUrl("/reset-password") });
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async updatePassword(password: string): Promise<SimpleResult> {
    const supabase = getSupabase();
    if (!supabase) return { ok: false, error: NOT_CONFIGURED };
    const { error } = await supabase.auth.updateUser({ password });
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  async signOut(): Promise<void> {
    await getSupabase()?.auth.signOut();
  },

  /** Permanently deletes the signed-in account, its photos and all of its data. */
  async deleteAccount(): Promise<SimpleResult> {
    const supabase = getSupabase();
    const userId = getActiveUserId();
    if (!supabase || !userId) return { ok: false, error: "Please log in again." };
    await removeUserImages(supabase, userId).catch((error: unknown) => console.error(error));
    const { error } = await supabase.rpc("delete_my_account");
    if (error) return { ok: false, error: "We couldn't delete your account. Please try again." };
    await supabase.auth.signOut();
    clearLocalData();
    return { ok: true };
  },
};

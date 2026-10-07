import { createId } from "@/lib/utils";
import type { UserAccount, UserProfile } from "@/types/user";
import {
  arrayOf,
  clearUserData,
  createPersistentStore,
  getActiveUserId,
  isRecord,
  isString,
  sessionStore,
  setSession,
} from "./core";
import { recipesStorage } from "./recipes";
import { reviewsStorage } from "./reviews";

/**
 * Accounts created by real visitors on this browser. There are no default or
 * demo accounts: the list starts empty.
 */
const isAccount = (v: unknown): v is UserAccount =>
  isRecord(v) &&
  isString(v.id) &&
  isString(v.name) &&
  isString(v.username) &&
  isString(v.email) &&
  isString(v.passwordHash) &&
  isString(v.passwordSalt);

export const accountsStore = createPersistentStore<UserAccount[]>("accounts", [], (value) =>
  arrayOf(isAccount)(value)?.map((a) => ({
    ...a,
    avatar: isString(a.avatar) ? a.avatar : "",
    bio: isString(a.bio) ? a.bio : "",
    location: isString(a.location) ? a.location : "",
    createdAt: isString(a.createdAt) ? a.createdAt : new Date().toISOString(),
    status: a.status === "suspended" ? "suspended" : "active",
  })) ?? null,
);

export function toProfile(account: UserAccount): UserProfile {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, passwordSalt, ...profile } = account;
  return profile;
}

/* ---------- Password hashing (frontend demo) ---------- */

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Salted SHA-256. Real auth would hash server-side; this just avoids storing plain passwords. */
async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  if (typeof crypto !== "undefined" && crypto.subtle) {
    return toHex(await crypto.subtle.digest("SHA-256", data));
  }
  // Insecure contexts (e.g. plain-HTTP LAN addresses) have no SubtleCrypto.
  let h = 2166136261;
  for (const byte of data) h = Math.imul(h ^ byte, 16777619) >>> 0;
  return `fnv-${h.toString(16)}`;
}

const SESSION_FLAG = "recipenest:session-active";

function markBrowserSession() {
  try {
    window.sessionStorage.setItem(SESSION_FLAG, "1");
  } catch {
    // ignore
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export type AccountResult = { ok: true; profile: UserProfile } | { ok: false; field?: "email" | "username" | "password"; error: string };

export const accountsStorage = {
  current(): UserProfile | null {
    const id = getActiveUserId();
    const account = id ? accountsStore.get().find((a) => a.id === id) : undefined;
    return account ? toProfile(account) : null;
  },

  async register(input: {
    name: string;
    username: string;
    email: string;
    password: string;
    avatar: string;
    bio: string;
  }): Promise<AccountResult> {
    const accounts = accountsStore.get();
    const email = normalizeEmail(input.email);
    const username = input.username.trim().toLowerCase();
    if (accounts.some((a) => a.email === email)) {
      return { ok: false, field: "email", error: "An account with this email already exists on this device. Log in instead." };
    }
    if (accounts.some((a) => a.username === username)) {
      return { ok: false, field: "username", error: "That username is taken. Try another." };
    }
    const salt = createId("salt");
    const account: UserAccount = {
      id: createId("user"),
      name: input.name.trim(),
      username,
      email,
      avatar: input.avatar,
      bio: input.bio.trim(),
      location: "",
      createdAt: new Date().toISOString(),
      status: "active",
      passwordSalt: salt,
      passwordHash: await hashPassword(input.password, salt),
    };
    accountsStore.set((prev) => [...prev, account]);
    setSession({ userId: account.id, remember: true });
    markBrowserSession();
    return { ok: true, profile: toProfile(account) };
  },

  async signIn(email: string, password: string, remember: boolean): Promise<AccountResult> {
    const account = accountsStore.get().find((a) => a.email === normalizeEmail(email));
    if (!account) {
      return { ok: false, field: "email", error: "No profile with that email exists on this device. Create one to get started." };
    }
    if ((await hashPassword(password, account.passwordSalt)) !== account.passwordHash) {
      return { ok: false, field: "password", error: "That password doesn't match. Try again." };
    }
    if (account.status === "suspended") {
      return { ok: false, error: "This profile has been suspended from the admin console." };
    }
    setSession({ userId: account.id, remember });
    markBrowserSession();
    return { ok: true, profile: toProfile(account) };
  },

  signOut() {
    setSession({ userId: null, remember: true });
  },

  /** Ends "don't remember me" sessions left over from a previous browser session. */
  expireIfNeeded() {
    const session = sessionStore.get();
    if (!session.userId || session.remember) return;
    try {
      if (!window.sessionStorage.getItem(SESSION_FLAG)) accountsStorage.signOut();
    } catch {
      // ignore
    }
  },

  updateProfile(id: string, patch: Partial<Pick<UserAccount, "name" | "username" | "avatar" | "bio" | "location">>): AccountResult {
    const accounts = accountsStore.get();
    if (patch.username) {
      const username = patch.username.trim().toLowerCase();
      if (accounts.some((a) => a.id !== id && a.username === username)) {
        return { ok: false, field: "username", error: "That username is taken. Try another." };
      }
      patch = { ...patch, username };
    }
    let updated: UserAccount | undefined;
    accountsStore.set((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        updated = { ...a, ...patch };
        return updated;
      }),
    );
    return updated ? { ok: true, profile: toProfile(updated) } : { ok: false, error: "Profile not found." };
  },

  setStatus(id: string, status: UserAccount["status"]) {
    accountsStore.set((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
    if (status === "suspended" && getActiveUserId() === id) accountsStorage.signOut();
  },

  /** Deletes an account, its recipes and all of its personal data on this device. */
  remove(id: string) {
    if (getActiveUserId() === id) accountsStorage.signOut();
    accountsStore.set((prev) => prev.filter((a) => a.id !== id));
    recipesStorage.removeByAuthor(id);
    reviewsStorage.removeByAuthor(id);
    clearUserData(id);
  },
};

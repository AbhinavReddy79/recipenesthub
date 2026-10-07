import { useSyncExternalStore } from "react";
import type { Session } from "@/types/user";

/**
 * Minimal external stores persisted to localStorage.
 *
 * Two scopes:
 * - "device": shared by everyone using this browser (accounts, the session,
 *   published community recipes).
 * - "user": namespaced by the signed-in account. With nobody signed in these
 *   read as their empty default and writes are ignored, so personal data can
 *   never leak between accounts or exist without one.
 *
 * The server (and the hydration pass) always sees the default value, so markup
 * matches; the client re-renders with saved data right after hydration. Every
 * read goes through `sanitize`, so missing or corrupted data falls back safely.
 *
 * When a backend arrives, the modules in lib/storage keep their API and only
 * their implementation changes.
 */
export interface PersistentStore<T> {
  get(): T;
  getServerSnapshot(): T;
  set(next: T | ((prev: T) => T)): void;
  reset(): void;
  subscribe(listener: () => void): () => void;
}

/** Turns unknown parsed JSON into a valid value, or `null` to use the default. */
export type Sanitizer<T> = (value: unknown) => T | null;

export const STORAGE_PREFIX = "recipenest:v1:";

export function readJSON(key: string): unknown {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : (JSON.parse(raw) as unknown);
  } catch {
    return undefined;
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be full or disabled (private mode); the in-memory value still works.
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/* ---------- Sanitizer helpers ---------- */

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isString = (value: unknown): value is string => typeof value === "string";

/** Keeps the valid items of an array and drops the rest. */
export function arrayOf<T>(guard: (item: unknown) => item is T): Sanitizer<T[]> {
  return (value) => (Array.isArray(value) ? value.filter(guard) : null);
}

/* ---------- Store factory ---------- */

type Scope = "device" | "user";

const registry: Array<{ scope: Scope; reset: () => void; invalidate: () => void }> = [];
const scopeListeners = new Set<() => void>();
let activeUserCache: { value: string | null } | null = null;

/** The signed-in account id, read straight from the persisted session. */
export function getActiveUserId(): string | null {
  if (typeof window === "undefined") return null;
  if (!activeUserCache) {
    const raw = readJSON(SESSION_KEY);
    activeUserCache = { value: isRecord(raw) && isString(raw.userId) ? raw.userId : null };
  }
  return activeUserCache.value;
}

/** Storage key prefix for one account's personal data. */
export const userKeyPrefix = (userId: string) => `${STORAGE_PREFIX}u:${userId}:`;

function notifyScopeChange() {
  activeUserCache = null;
  registry.forEach((s) => s.scope === "user" && s.invalidate());
  scopeListeners.forEach((listener) => listener());
}

export function createPersistentStore<T>(
  name: string,
  initial: T,
  sanitize: Sanitizer<T>,
  scope: Scope = "device",
): PersistentStore<T> {
  const listeners = new Set<() => void>();
  let cache: { key: string | null; value: T } | null = null;

  const keyFor = (): string | null => {
    if (scope === "device") return STORAGE_PREFIX + name;
    const userId = getActiveUserId();
    return userId ? userKeyPrefix(userId) + name : null;
  };

  const emit = () => listeners.forEach((listener) => listener());

  const store: PersistentStore<T> = {
    get() {
      if (typeof window === "undefined") return initial;
      const key = keyFor();
      if (!cache || cache.key !== key) {
        const parsed = key ? readJSON(key) : undefined;
        cache = { key, value: parsed === undefined ? initial : (sanitize(parsed) ?? initial) };
      }
      return cache.value;
    },
    getServerSnapshot() {
      return initial;
    },
    set(next) {
      const key = keyFor();
      if (!key) return; // user-scoped data needs a signed-in account
      const value = typeof next === "function" ? (next as (prev: T) => T)(store.get()) : next;
      cache = { key, value };
      writeJSON(key, value);
      emit();
    },
    reset() {
      const key = keyFor();
      if (key) removeKey(key);
      cache = null;
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      if (scope === "user") scopeListeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === keyFor() || event.key === SESSION_KEY) {
          if (event.key === SESSION_KEY) activeUserCache = null;
          cache = null;
          listener();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        scopeListeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };

  registry.push({
    scope,
    reset: store.reset,
    invalidate: () => {
      cache = null;
    },
  });
  return store;
}

/** Clears every RecipeNest key in this browser (all accounts and their data). */
export function clearAllLocalData(): void {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
  registry.forEach((s) => s.invalidate());
  notifyScopeChange();
  sessionStore.reset();
}

/** Removes every personal key that belongs to one account. */
export function clearUserData(userId: string): void {
  const prefix = userKeyPrefix(userId);
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(prefix))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
  notifyScopeChange();
}

export function useStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}

/* ---------- Session ---------- */

const SESSION_KEY = `${STORAGE_PREFIX}session`;
const signedOut: Session = { userId: null, remember: true };

/**
 * Which account is signed in on this device. Changing it switches every
 * user-scoped store to that account's data.
 */
export const sessionStore = createPersistentStore<Session>("session", signedOut, (v) =>
  isRecord(v) ? { userId: isString(v.userId) ? v.userId : null, remember: v.remember !== false } : null,
);

export function setSession(session: Session): void {
  sessionStore.set(session);
  notifyScopeChange();
}

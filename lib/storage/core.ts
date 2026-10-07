import { useSyncExternalStore } from "react";

/**
 * Small external stores the hooks subscribe to.
 *
 * - Memory stores hold data loaded from Supabase (the source of truth for
 *   accounts and personal data). Updates are applied optimistically and then
 *   saved; see lib/storage/remote.ts.
 * - Local stores persist device-only preferences to localStorage (pricing
 *   region, unsaved recipe-form progress) that work without an account.
 *
 * The server (and the hydration pass) always sees the initial value, so markup
 * matches; the client re-renders once data has loaded.
 */
export interface Store<T> {
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

/* ---------- Stores ---------- */

/** In-memory store for data loaded from Supabase. */
export function createMemoryStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  const store: Store<T> = {
    get: () => value,
    getServerSnapshot: () => initial,
    set(next) {
      value = typeof next === "function" ? (next as (prev: T) => T)(value) : next;
      emit();
    },
    reset() {
      value = initial;
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return store;
}

/** Device-only store persisted to localStorage and synced across tabs. */
export function createLocalStore<T>(name: string, initial: T, sanitize: Sanitizer<T>): Store<T> {
  const key = STORAGE_PREFIX + name;
  const listeners = new Set<() => void>();
  let cache: { value: T } | null = null;
  const emit = () => listeners.forEach((listener) => listener());

  const store: Store<T> = {
    get() {
      if (typeof window === "undefined") return initial;
      if (!cache) {
        const parsed = readJSON(key);
        cache = { value: parsed === undefined ? initial : (sanitize(parsed) ?? initial) };
      }
      return cache.value;
    },
    getServerSnapshot: () => initial,
    set(next) {
      const value = typeof next === "function" ? (next as (prev: T) => T)(store.get()) : next;
      cache = { value };
      writeJSON(key, value);
      emit();
    },
    reset() {
      removeKey(key);
      cache = null;
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === key) {
          cache = null;
          listener();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
  };
  localStores.push(store);
  return store;
}

const localStores: Pick<Store<unknown>, "reset">[] = [];

/** Clears everything RecipeNest keeps in this browser (preferences and unsaved drafts). */
export function clearLocalData(): void {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
  localStores.forEach((store) => store.reset());
}

export function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}

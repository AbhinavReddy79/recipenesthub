import { toast } from "sonner";
import { getSupabase, type RecipeNestClient } from "@/lib/supabase/client";
import { BUCKETS, supabaseUrl } from "@/lib/supabase/env";
import { getActiveUserId } from "./session";

/**
 * Image links saved by users are only shown when they point at our own
 * storage bucket (or Unsplash, which the recipe form allows). Anything else
 * (another site, a tracking pixel) is dropped, even if it was written
 * straight to the API. The database enforces the same rule.
 */
export function safeImageUrl(url: string | null | undefined, bucket: (typeof BUCKETS)[keyof typeof BUCKETS]): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return "";
    if (parsed.hostname === "images.unsplash.com") return parsed.toString();
    const storage = supabaseUrl ? new URL(`/storage/v1/object/public/${bucket}/`, supabaseUrl) : null;
    return storage && parsed.origin === storage.origin && parsed.pathname.startsWith(storage.pathname) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

/** The Supabase client and signed-in user id, or null for visitors (personal writes are skipped). */
export function userContext(): { supabase: RecipeNestClient; userId: string } | null {
  const supabase = getSupabase();
  const userId = getActiveUserId();
  return supabase && userId ? { supabase, userId } : null;
}

export function reportError(action: string, error: unknown): void {
  console.error(`RecipeNest: couldn't ${action}`, error);
  toast.error(`Couldn't ${action}. Please check your connection and try again.`);
}

/**
 * Saves an optimistic change. On failure the user is told and `onFail` runs
 * (usually a reload from the database, so the screen shows what was saved).
 */
export function persist(action: string, request: PromiseLike<{ error: unknown }>, onFail?: () => void): void {
  Promise.resolve(request).then(
    ({ error }) => {
      if (!error) return;
      reportError(action, error);
      onFail?.();
    },
    (error: unknown) => {
      reportError(action, error);
      onFail?.();
    },
  );
}

/** Runs several dependent writes in order, treating the whole set as one save. */
export function persistAll(action: string, steps: () => Promise<{ error: unknown } | void>, onFail?: () => void): void {
  persist(action, steps().then((result) => result ?? { error: null }), onFail);
}

/* ---------- Images ---------- */

export const isDataUrl = (value: string) => value.startsWith("data:");

/** Uploads an image picked in the browser (a data URL) and returns its public URL. */
export async function uploadImage(
  supabase: RecipeNestClient,
  bucket: (typeof BUCKETS)[keyof typeof BUCKETS],
  path: string,
  dataUrl: string,
): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: true });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Deletes every image a user uploaded (used before deleting their account). */
export async function removeUserImages(supabase: RecipeNestClient, userId: string): Promise<void> {
  for (const bucket of Object.values(BUCKETS)) {
    const { data } = await supabase.storage.from(bucket).list(userId, { limit: 1000 });
    const paths = (data ?? []).map((file) => `${userId}/${file.name}`);
    if (paths.length) await supabase.storage.from(bucket).remove(paths);
  }
}

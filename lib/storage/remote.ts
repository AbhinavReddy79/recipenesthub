import { toast } from "sonner";
import { getSupabase, type RecipeNestClient } from "@/lib/supabase/client";
import { BUCKETS } from "@/lib/supabase/env";
import { getActiveUserId } from "./session";

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

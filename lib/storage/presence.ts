import type { RecipeNestClient } from "@/lib/supabase/client";
import { userContext } from "./remote";

/** Seen within this long counts as "using the site now". */
export const ONLINE_WINDOW_MS = 2 * 60_000;
const HEARTBEAT_MS = 60_000;

/**
 * While the signed-in member has the site open in a visible tab, tells the
 * database they're active about once a minute (admins see a green dot).
 * Hidden tabs send nothing. Returns a function that stops it.
 */
export function startHeartbeat(supabase: RecipeNestClient): () => void {
  let timer: number | undefined;
  const touch = () => {
    if (document.visibilityState !== "visible") return;
    void supabase.rpc("touch_last_seen").then(({ error }) => {
      if (error) console.warn("activity heartbeat failed", error.message);
    });
  };
  const onVisibility = () => {
    if (document.visibilityState === "visible") touch();
  };
  touch();
  timer = window.setInterval(touch, HEARTBEAT_MS);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.clearInterval(timer);
    timer = undefined;
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

/** Admins: when each member was last active, keyed by user id. */
export async function adminListPresence(): Promise<Record<string, string>> {
  const ctx = userContext();
  if (!ctx) return {};
  const { data, error } = await ctx.supabase.rpc("admin_list_presence");
  if (error) throw error;
  return Object.fromEntries((data ?? []).filter((r) => r.last_seen_at).map((r) => [r.user_id, r.last_seen_at as string]));
}

export const isOnline = (lastSeen: string | undefined, now: number) =>
  Boolean(lastSeen) && now - Date.parse(lastSeen as string) < ONLINE_WINDOW_MS;

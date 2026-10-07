import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

export type RecipeNestClient = SupabaseClient<Database>;

let client: RecipeNestClient | null = null;

/**
 * The browser Supabase client (session kept in cookies so the server and proxy
 * see it too). Returns null when the project isn't configured, so the site
 * still renders the catalog without a backend.
 */
export function getSupabase(): RecipeNestClient | null {
  if (!isSupabaseConfigured || typeof window === "undefined") return null;
  client ??= createBrowserClient<Database>(supabaseUrl, supabaseKey);
  return client;
}

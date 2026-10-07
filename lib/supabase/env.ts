/**
 * Public Supabase settings. Both values are designed to be public: data is
 * protected by row level security, not by hiding these. The service-role key
 * is never used by this app and must never be added to it.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/** Storage buckets created by the migration. */
export const BUCKETS = { avatars: "avatars", recipeImages: "recipe-images" } as const;

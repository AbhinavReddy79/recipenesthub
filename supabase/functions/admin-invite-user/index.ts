// Supabase Edge Function: lets an active RecipeNest admin invite someone by email.
//
// Inviting needs Supabase's service-role key, which must never be in the
// website. Edge Functions already have it, so the site calls this function
// with the admin's own sign-in token; we check they really are an active admin
// (in the database) before sending the invite.
//
// Deploy with "Verify JWT" on. The invite email's link opens
// <site>/reset-password?invite=1, where the person chooses their password.
import { createClient } from "jsr:@supabase/supabase-js@2";

const SITES = ["https://recipe-nest-tan.vercel.app", "https://recipenesthub.com", "https://www.recipenesthub.com", "http://localhost:3000"];
const DEFAULT_SITE = SITES[0];
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function cors(origin: string | null) {
  const allowed = origin && SITES.includes(origin) ? origin : DEFAULT_SITE;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return reply(401, { error: "signed_out" });

  // 1. Who is asking? Use their own token, so the database's rules apply.
  const asCaller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: isAdmin, error: adminError } = await asCaller.rpc("is_admin");
  if (adminError || isAdmin !== true) return reply(403, { error: "not_admin" });

  // 2. Validate the request.
  const body = (await req.json().catch(() => null)) as { email?: unknown; name?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!EMAIL.test(email) || email.length > 254) return reply(400, { error: "invalid_email" });
  if (!name) return reply(400, { error: "invalid_name" });

  // 3. Send the invite with the service role (only ever used here, after the checks above).
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const site = origin && SITES.includes(origin) ? origin : DEFAULT_SITE;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name },
    redirectTo: `${site}/reset-password?invite=1`,
  });

  if (error) {
    const message = error.message.toLowerCase();
    if (error.status === 422 || message.includes("already been registered") || message.includes("already exists")) {
      return reply(409, { error: "already_registered" });
    }
    if (error.status === 429 || message.includes("rate limit")) return reply(429, { error: "rate_limited" });
    console.error("invite failed", error.status, error.message);
    return reply(500, { error: "invite_failed" });
  }
  return reply(200, { ok: true, userId: data.user?.id ?? null });
});

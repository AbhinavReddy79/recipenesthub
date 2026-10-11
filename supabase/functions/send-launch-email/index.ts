// Supabase Edge Function: emails the launch waitlist ("We're live, come join")
// from the admin dashboard, through the owner's Gmail. People on the waitlist
// don't need an account: the email links them to sign up.
//
// Who may send: the owner, or an admin with the "Members" power (checked in the
// database with the caller's own sign-in token).
//
// Secrets (Supabase -> Edge Functions -> Secrets), entered by the owner:
//   GMAIL_USER          the Gmail address to send from
//   GMAIL_APP_PASSWORD  a Google "app password" for that account (not the normal password)
//
// Deploy with "Verify JWT with legacy secret" OFF: this function checks access itself.
//
// Request body: { mode: "test" | "send", subject: string, message: string }
//   test -> sends one copy to the admin who asked
//   send -> sends to up to BATCH people not yet notified, marks them notified,
//           and returns how many are left (the dashboard calls again until 0)
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const SITES = ["https://recipe-nest-tan.vercel.app", "https://recipenesthub.com", "https://www.recipenesthub.com", "http://localhost:3000"];
const DEFAULT_SITE = SITES[0];
const BATCH = 40;

function cors(origin: string | null) {
  const allowed = origin && SITES.includes(origin) ? origin : DEFAULT_SITE;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function emailHtml(message: string, joinUrl: string, site: string) {
  const paragraphs = escapeHtml(message)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#f6f1e8;font-family:Arial,Helvetica,sans-serif;color:#2b2620">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e8;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#1b1916;padding:24px 28px;color:#ffffff;font-family:Georgia,serif;font-size:26px;font-weight:bold">Recipe<span style="color:#e8b84a">Nest</span></td></tr>
<tr><td style="padding:28px;font-size:16px">${paragraphs}
<p style="margin:24px 0"><a href="${joinUrl}" style="display:inline-block;background:#e8b84a;color:#1b1916;text-decoration:none;font-weight:bold;padding:14px 26px;border-radius:999px">Join RecipeNest</a></p>
<p style="margin:0;color:#7a7266;font-size:13px;line-height:1.5">New members get 1 month of Premium free.</p>
</td></tr>
<tr><td style="padding:18px 28px;background:#faf7f2;color:#8a8275;font-size:12px;line-height:1.5">
You're getting this one email because you asked to be told when RecipeNest launches. We won't email you again unless you join.
<br><a href="${site}" style="color:#8a8275">${site.replace(/^https?:\/\//, "")}</a></td></tr>
</table></td></tr></table></body></html>`;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });

  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return reply(401, { error: "signed_out" });

  // 1. Who is asking? Their own token, so the database's rules decide.
  const asCaller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: allowed, error: powerError } = await asCaller.rpc("has_admin_power", { power_name: "members" });
  if (powerError || allowed !== true) return reply(403, { error: "not_admin" });

  // 2. Validate the request.
  const body = (await req.json().catch(() => null)) as { mode?: unknown; subject?: unknown; message?: unknown } | null;
  const mode = body?.mode === "send" ? "send" : body?.mode === "test" ? "test" : null;
  const subject = typeof body?.subject === "string" ? body.subject.trim().slice(0, 150) : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 4000) : "";
  if (!mode) return reply(400, { error: "invalid_mode" });
  if (subject.length < 3 || message.length < 10) return reply(400, { error: "invalid_content" });

  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!gmailUser || !gmailPassword) return reply(500, { error: "email_not_configured" });

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPassword },
  });

  const site = origin && SITES.includes(origin) ? origin : DEFAULT_SITE;
  const html = emailHtml(message, `${site}/register`, site);
  const text = `${message}\n\nJoin RecipeNest: ${site}/register\nNew members get 1 month of Premium free.\n\nYou're getting this one email because you asked to be told when RecipeNest launches.`;
  const send = (to: string) => transport.sendMail({ from: `RecipeNest <${gmailUser}>`, to, subject, text, html });

  // 3a. Test: one copy to the admin.
  if (mode === "test") {
    const { data: me } = await asCaller.auth.getUser();
    const to = me.user?.email;
    if (!to) return reply(400, { error: "no_email" });
    try {
      await send(to);
      return reply(200, { ok: true, sentTo: to });
    } catch (error) {
      console.error("test send failed", error);
      return reply(502, { error: "send_failed" });
    }
  }

  // 3b. Send to the next batch of people not yet notified (service role, only after the checks above).
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: batch, error: listError } = await admin
    .from("launch_waitlist")
    .select("email")
    .is("notified_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH);
  if (listError) return reply(500, { error: "list_failed" });

  let sent = 0;
  const failed: string[] = [];
  for (const { email } of batch ?? []) {
    try {
      await send(email);
      await admin.from("launch_waitlist").update({ notified_at: new Date().toISOString() }).eq("email", email);
      sent++;
    } catch (error) {
      console.error("send failed", email, error);
      failed.push(email);
      // Gmail's daily limit or a login problem: stop and report rather than failing everyone.
      if (failed.length >= 3 && sent === 0) break;
    }
  }

  const { count } = await admin.from("launch_waitlist").select("email", { count: "exact", head: true }).is("notified_at", null);
  return reply(200, { ok: true, sent, failed, remaining: count ?? 0 });
});

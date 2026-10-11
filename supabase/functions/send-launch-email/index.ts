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
// Request body: { mode: "test" | "send" | "direct", subject: string, message: string, emails?: string[] }
//   test   -> sends one copy to the admin who asked
//   send   -> sends to up to BATCH people not yet notified, marks them notified,
//             and returns how many are left (the dashboard calls again until 0)
//   direct -> sends to the addresses the admin typed in (up to BATCH, no
//             account is created) and records them on the waitlist as notified
//
// To keep mail out of spam, the email reads like a short letter (no colour
// blocks or promo footer), carries Reply-To and List-Unsubscribe headers, and
// goes out one at a time with a short pause.
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.16";

const SITES = ["https://recipe-nest-tan.vercel.app", "https://recipenesthub.com", "https://www.recipenesthub.com", "http://localhost:3000"];
const DEFAULT_SITE = SITES[0];
const BATCH = 25;
const PAUSE_MS = 2000;
const pause = () => new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
const EMAIL = /^[^@\s,;<>"]+@[^@\s,;<>"]+\.[^@\s,;<>"]+$/;

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

function emailHtml(message: string, joinUrl: string, site: string, unsubscribe: string) {
  const paragraphs = escapeHtml(message)
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
  return `<!doctype html><html><body style="margin:0;padding:24px 16px;font-family:Arial,Helvetica,sans-serif;font-size:16px;color:#222222">
<div style="max-width:560px;margin:0 auto">
<p style="margin:0 0 20px;font-family:Georgia,serif;font-size:22px;font-weight:bold">RecipeNest</p>
${paragraphs}
<p style="margin:20px 0"><a href="${joinUrl}" style="display:inline-block;background:#c8962e;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:6px">Join RecipeNest</a></p>
<p style="margin:0 0 16px;line-height:1.6">Or open this link: <a href="${joinUrl}">${joinUrl}</a></p>
<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0 12px">
<p style="margin:0;color:#777777;font-size:12px;line-height:1.5">You're getting this because you asked to be told when RecipeNest launches (${escapeHtml(site.replace(/^https?:\/\//, ""))}).
Don't want emails from us? <a href="${unsubscribe}" style="color:#777777">Unsubscribe</a> or just reply "unsubscribe".</p>
</div></body></html>`;
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
  const body = (await req.json().catch(() => null)) as { mode?: unknown; subject?: unknown; message?: unknown; emails?: unknown } | null;
  const mode = body?.mode === "send" || body?.mode === "test" || body?.mode === "direct" ? body.mode : null;
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
    auth: { user: gmailUser, pass: gmailPassword.replace(/\s+/g, "") },
  });

  const site = origin && SITES.includes(origin) ? origin : DEFAULT_SITE;
  const joinUrl = `${site}/register`;
  const unsubscribe = `mailto:${gmailUser}?subject=unsubscribe`;
  const html = emailHtml(message, joinUrl, site, unsubscribe);
  const text = `${message}\n\nJoin RecipeNest: ${joinUrl}\n\n--\nYou're getting this because you asked to be told when RecipeNest launches. Don't want emails from us? Reply "unsubscribe".`;
  const send = (to: string) =>
    transport.sendMail({
      from: { name: "RecipeNest", address: gmailUser },
      replyTo: gmailUser,
      to,
      subject,
      text,
      html,
      headers: { "List-Unsubscribe": `<${unsubscribe}>` },
    });

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

  // Service role from here on, only after the checks above.
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // 3b. Direct invitations to addresses the admin typed in. No account is created;
  // each address is kept on the waitlist as notified so it isn't emailed twice.
  if (mode === "direct") {
    const list = Array.isArray(body?.emails) ? body.emails : [];
    const emails = [
      ...new Set(list.filter((e): e is string => typeof e === "string").map((e) => e.trim().toLowerCase())),
    ].filter((e) => e.length <= 254 && EMAIL.test(e));
    if (emails.length === 0) return reply(400, { error: "invalid_emails" });
    if (emails.length > BATCH) return reply(400, { error: "too_many_emails" });
    let sent = 0;
    const failed: string[] = [];
    for (const email of emails) {
      try {
        if (sent || failed.length) await pause();
        await send(email);
        await admin
          .from("launch_waitlist")
          .upsert({ email, notified_at: new Date().toISOString() }, { onConflict: "email" });
        sent++;
      } catch (error) {
        console.error("direct send failed", email, error);
        failed.push(email);
        if (failed.length >= 3 && sent === 0) break;
      }
    }
    return reply(200, { ok: true, sent, failed });
  }

  // 3c. Send to the next batch of people on the waitlist not yet notified.
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
      if (sent || failed.length) await pause();
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

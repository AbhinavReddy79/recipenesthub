// Supabase Edge Function: sends RecipeNest invitation emails. Nobody needs an
// account: the email links them to sign up.
//
// Secrets (Supabase -> Edge Functions -> Secrets), entered by the owner:
//   BREVO_API_KEY       Brevo API key; when set, email goes through Brevo's API
//   BREVO_SMTP_LOGIN    Brevo SMTP login + BREVO_SMTP_KEY: email goes through
//   BREVO_SMTP_KEY        Brevo's SMTP server (used when there's no API key)
//   SENDER_EMAIL        optional "from" address (a verified Brevo sender); defaults to GMAIL_USER
//   GMAIL_USER          the Gmail address (sender address, and Gmail fallback login)
//   GMAIL_APP_PASSWORD  Google app password, only used when neither Brevo option is set
//
// Deploy with "Verify JWT with legacy secret" OFF: this function checks access itself.
//
// Request body:
//   From the admin dashboard (owner, or an admin with the "Members" power,
//   checked in the database with the caller's own sign-in token):
//     { mode: "test" | "send" | "direct", subject, message, emails? }
//     test   -> one copy to the admin who asked
//     send   -> the next BATCH people on the waitlist not yet notified; returns
//               how many are left (the dashboard calls again until 0)
//     direct -> the addresses the admin typed in (up to BATCH); no account is
//               created, they're recorded on the waitlist as notified
//   From the minute timer (pg_cron, see the scheduled_emails migration):
//     { mode: "scheduled", nonce } -> the nonce is a single-use code the
//               database just created; sends the next due scheduled email
//
// To keep mail out of spam, the email reads like a short letter (no colour
// blocks or promo footer), carries Reply-To and List-Unsubscribe headers, and
// goes out one at a time with a short pause.
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
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

/**
 * A sender for one subject and message, or null if no email service is set up.
 * Uses Brevo when BREVO_API_KEY is set (built for website email: no sign-in
 * blocks, better delivery), otherwise the owner's Gmail.
 */
function makeSender(subject: string, message: string, site: string) {
  const brevoKey = Deno.env.get("BREVO_API_KEY");
  // The address emails come from (verified as a sender in Brevo); GMAIL_USER for older setups.
  const fromAddress = Deno.env.get("SENDER_EMAIL") ?? Deno.env.get("GMAIL_USER");
  if (!fromAddress) return null;

  const joinUrl = `${site}/register`;
  const unsubscribe = `mailto:${fromAddress}?subject=unsubscribe`;
  const html = emailHtml(message, joinUrl, site, unsubscribe);
  const text = `${message}\n\nJoin RecipeNest: ${joinUrl}\n\n--\nYou're getting this because you asked to be told when RecipeNest launches. Don't want emails from us? Reply "unsubscribe".`;

  if (brevoKey) {
    return async (to: string) => {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevoKey.trim(), "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: { name: "RecipeNest", email: fromAddress },
          replyTo: { email: fromAddress },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text,
          headers: { "List-Unsubscribe": `<${unsubscribe}>` },
        }),
      });
      if (!response.ok) throw new Error(`Brevo ${response.status}: ${(await response.text()).slice(0, 300)}`);
    };
  }

  // Brevo SMTP (an SMTP key from Brevo -> SMTP & API -> SMTP). Port 465: Supabase blocks 587.
  const brevoLogin = Deno.env.get("BREVO_SMTP_LOGIN");
  const brevoSmtpKey = Deno.env.get("BREVO_SMTP_KEY");
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailPassword = Deno.env.get("GMAIL_APP_PASSWORD");
  const smtp =
    brevoLogin && brevoSmtpKey
      ? { host: "smtp-relay.brevo.com", user: brevoLogin.trim(), pass: brevoSmtpKey.trim() }
      : gmailUser && gmailPassword
        ? { host: "smtp.gmail.com", user: gmailUser, pass: gmailPassword.replace(/\s+/g, "") }
        : null;
  if (!smtp) return null;
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: 465,
    secure: true,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  return (to: string) =>
    transport.sendMail({
      from: { name: "RecipeNest", address: fromAddress },
      replyTo: fromAddress,
      to,
      subject,
      text,
      html,
      headers: { "List-Unsubscribe": `<${unsubscribe}>` },
    });
}

/** Sends to each address in turn; returns who got it and who didn't. */
async function sendEach(emails: string[], send: (to: string) => Promise<unknown>, onSent: (email: string) => Promise<unknown>) {
  const sentTo: string[] = [];
  const failed: string[] = [];
  for (const email of emails) {
    try {
      if (sentTo.length || failed.length) await pause();
      await send(email);
      sentTo.push(email);
      await onSent(email);
    } catch (error) {
      console.error("send failed", email, error);
      if (!sentTo.includes(email)) failed.push(email);
      // Gmail's daily limit or a login problem: stop and report rather than failing everyone.
      if (failed.length >= 3 && sentTo.length === 0) break;
    }
  }
  return { sent: sentTo.length, sentTo, failed };
}

/** Throws if a database write failed, so problems show up in the logs instead of passing silently. */
function check<T extends { error: unknown }>(result: T, what: string): T {
  if (result.error) {
    console.error(`could not ${what}`, result.error);
    throw new Error(`could not ${what}`);
  }
  return result;
}

/** Adds a finished "Send now" email to the dashboard history. */
async function recordInstant(
  admin: SupabaseClient,
  fields: { subject: string; message: string; audience: "waitlist" | "direct"; emails: string[]; sentTo: string[]; failed: string[]; by: string | null },
) {
  const now = new Date().toISOString();
  const result = await admin.from("scheduled_emails").insert({
    kind: "instant",
    subject: fields.subject,
    message: fields.message,
    audience: fields.audience,
    emails: fields.audience === "direct" ? fields.emails : [],
    send_at: now,
    status: fields.sentTo.length ? "sent" : "failed",
    sent_count: fields.sentTo.length,
    sent_to: fields.sentTo,
    failed_emails: fields.failed,
    error: fields.sentTo.length ? null : "Gmail refused every address.",
    finished_at: now,
    created_by: fields.by,
  });
  // History is a convenience: log a failure but don't fail the send.
  if (result.error) console.error("could not record history", result.error);
}

const markNotified = (admin: SupabaseClient) => async (email: string) =>
  check(await admin.from("launch_waitlist").update({ notified_at: new Date().toISOString() }).eq("email", email), "mark notified");
const recordInvited = (admin: SupabaseClient) => async (email: string) =>
  check(
    await admin.from("launch_waitlist").upsert({ email, notified_at: new Date().toISOString() }, { onConflict: "email" }),
    "record invited",
  );

/** The next waitlist batch not yet notified. */
async function nextWaitlistBatch(admin: SupabaseClient) {
  const { data, error } = await admin
    .from("launch_waitlist")
    .select("email")
    .is("notified_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH);
  if (error) throw error;
  return (data ?? []).map((row) => row.email as string);
}

async function waitlistRemaining(admin: SupabaseClient) {
  const { count } = await admin.from("launch_waitlist").select("email", { count: "exact", head: true }).is("notified_at", null);
  return count ?? 0;
}

const cleanEmails = (list: unknown) =>
  [
    ...new Set(
      (Array.isArray(list) ? list : []).filter((e): e is string => typeof e === "string").map((e) => e.trim().toLowerCase()),
    ),
  ].filter((e) => e.length <= 254 && EMAIL.test(e));

/** The minute timer: sends the next due scheduled email (the waitlist a batch per run). */
async function runScheduled(admin: SupabaseClient) {
  const { data: claimed, error } = await admin.rpc("claim_scheduled_email");
  if (error) throw error;
  const job = (claimed as Record<string, unknown>[] | null)?.[0];
  if (!job) return { ok: true, idle: true };

  const id = job.id as string;
  const finish = async (fields: Record<string, unknown>) =>
    check(await admin.from("scheduled_emails").update(fields).eq("id", id), "update scheduled email");
  const send = makeSender(job.subject as string, job.message as string, DEFAULT_SITE);
  if (!send) {
    await finish({ status: "failed", error: "Email isn't set up (GMAIL_USER / GMAIL_APP_PASSWORD).", finished_at: new Date().toISOString() });
    return { ok: false, error: "email_not_configured" };
  }

  const previousSentTo = (job.sent_to as string[] | null) ?? [];
  const previousFailed = (job.failed_emails as string[] | null) ?? [];

  if (job.audience === "direct") {
    const { sent, sentTo, failed } = await sendEach(cleanEmails(job.emails), send, recordInvited(admin));
    await finish({
      status: sent ? "sent" : "failed",
      sent_count: sent,
      sent_to: sentTo,
      failed_emails: failed,
      error: sent ? null : "Gmail refused every address. Check the app password.",
      finished_at: new Date().toISOString(),
    });
    return { ok: true, sent, failed };
  }

  const batch = await nextWaitlistBatch(admin);
  const { sent, sentTo, failed } = await sendEach(batch, send, markNotified(admin));
  const remaining = await waitlistRemaining(admin);
  const allSentTo = [...new Set([...previousSentTo, ...sentTo])];
  // Someone who failed once but got it on a retry is no longer a failure.
  const allFailed = [...new Set([...previousFailed, ...failed])].filter((e) => !allSentTo.includes(e));
  const progress = { sent_count: allSentTo.length, sent_to: allSentTo, failed_emails: allFailed };
  if (batch.length && !sent) {
    await finish({ ...progress, status: "failed", error: "Gmail stopped sending (daily limit or app password).", finished_at: new Date().toISOString() });
  } else if (remaining > failed.length && sent) {
    // More to go: hand it back so the next minute's run continues.
    await finish({ ...progress, status: "scheduled", claimed_at: null });
  } else {
    await finish({ ...progress, status: "sent", finished_at: new Date().toISOString() });
  }
  return { ok: true, sent, failed, remaining };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = { ...cors(origin), "Content-Type": "application/json" };
  const reply = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), { status, headers });

  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return reply(405, { error: "method_not_allowed" });

  const body = (await req.json().catch(() => null)) as
    | { mode?: unknown; subject?: unknown; message?: unknown; emails?: unknown; nonce?: unknown }
    | null;

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // A. The minute timer. Its single-use code must exist in the database (and is burned here).
  if (body?.mode === "scheduled") {
    const nonce = typeof body.nonce === "string" ? body.nonce : "";
    const { data: valid } = nonce ? await admin.rpc("use_email_runner_nonce", { p_nonce: nonce }) : { data: false };
    if (valid !== true) return reply(403, { error: "invalid_nonce" });
    try {
      return reply(200, await runScheduled(admin));
    } catch (error) {
      console.error("scheduled run failed", error);
      return reply(500, { error: "scheduled_failed" });
    }
  }

  // B. The admin dashboard.
  const authorization = req.headers.get("Authorization") ?? "";
  if (!authorization.startsWith("Bearer ")) return reply(401, { error: "signed_out" });

  // Who is asking? Their own token, so the database's rules decide.
  const asCaller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: allowed, error: powerError } = await asCaller.rpc("has_admin_power", { power_name: "members" });
  if (powerError || allowed !== true) return reply(403, { error: "not_admin" });

  const mode = body?.mode === "send" || body?.mode === "test" || body?.mode === "direct" ? body.mode : null;
  const subject = typeof body?.subject === "string" ? body.subject.trim().slice(0, 150) : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 4000) : "";
  if (!mode) return reply(400, { error: "invalid_mode" });
  if (subject.length < 3 || message.length < 10) return reply(400, { error: "invalid_content" });

  const site = origin && SITES.includes(origin) ? origin : DEFAULT_SITE;
  const send = makeSender(subject, message, site);
  if (!send) return reply(500, { error: "email_not_configured" });

  const { data: me } = await asCaller.auth.getUser();
  const callerId = me.user?.id ?? null;

  if (mode === "test") {
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

  if (mode === "direct") {
    const emails = cleanEmails(body?.emails);
    if (emails.length === 0) return reply(400, { error: "invalid_emails" });
    if (emails.length > BATCH) return reply(400, { error: "too_many_emails" });
    const { sent, sentTo, failed } = await sendEach(emails, send, recordInvited(admin));
    await recordInstant(admin, { subject, message, audience: "direct", emails, sentTo, failed, by: callerId });
    return reply(200, { ok: true, sent, failed });
  }

  try {
    const batch = await nextWaitlistBatch(admin);
    const { sent, sentTo, failed } = await sendEach(batch, send, markNotified(admin));
    if (batch.length) await recordInstant(admin, { subject, message, audience: "waitlist", emails: [], sentTo, failed, by: callerId });
    return reply(200, { ok: true, sent, failed, remaining: await waitlistRemaining(admin) });
  } catch (error) {
    console.error("waitlist send failed", error);
    return reply(500, { error: "list_failed" });
  }
});

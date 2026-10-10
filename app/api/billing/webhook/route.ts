import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

/*
 * Razorpay webhooks (renewals, cancellations). The body is passed to the
 * database exactly as received; the database checks Razorpay's signature with
 * the webhook secret before changing anything. Set the webhook URL in Razorpay
 * to https://<site>/api/billing/webhook with the subscription.* events.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  const body = await request.text();
  if (!signature || body.length === 0 || body.length > 200_000) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { error } = await supabase.rpc("billing_webhook", { p_body: body, p_signature: signature });
  if (error) {
    // Invalid signature (42501) is final; anything else lets Razorpay retry.
    const invalid = error.code === "42501";
    if (!invalid) console.error("billing_webhook", error);
    return NextResponse.json({ error: invalid ? "invalid_signature" : "failed" }, { status: invalid ? 401 : 500 });
  }
  return NextResponse.json({ ok: true });
}

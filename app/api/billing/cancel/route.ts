import { NextResponse } from "next/server";
import { cancelSubscription, isRazorpayConfigured } from "@/lib/billing/razorpay";
import { currentMember, isSameOrigin, jsonError } from "@/lib/billing/route-helpers";

/** Stops the member's renewals. Premium continues until the period already paid for ends. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("forbidden", 403);
  if (!isRazorpayConfigured()) return jsonError("not_configured", 503);

  const member = await currentMember();
  if (!member) return jsonError("signed_out", 401);

  // Members can only read their own row, so this is always their own subscription.
  const { data: subscription } = await member.supabase
    .from("subscriptions")
    .select("razorpay_subscription_id, status")
    .eq("user_id", member.userId)
    .maybeSingle();
  if (!subscription?.razorpay_subscription_id || !["active", "pending"].includes(subscription.status)) {
    return jsonError("no_subscription", 404);
  }

  try {
    await cancelSubscription(subscription.razorpay_subscription_id);
  } catch (error) {
    console.error(error);
    return jsonError("razorpay_failed", 502);
  }
  await member.supabase.rpc("billing_mark_cancelled");
  return NextResponse.json({ ok: true });
}

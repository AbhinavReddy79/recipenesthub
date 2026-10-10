import { NextResponse } from "next/server";
import { createSubscription, isRazorpayConfigured } from "@/lib/billing/razorpay";
import { currentMember, isSameOrigin, jsonError } from "@/lib/billing/route-helpers";

/** Creates a Razorpay subscription for the signed-in member; the browser then opens Checkout. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("forbidden", 403);
  if (!isRazorpayConfigured()) return jsonError("not_configured", 503);

  const body: unknown = await request.json().catch(() => null);
  const period = (body as { period?: unknown } | null)?.period;
  if (period !== "monthly" && period !== "yearly") return jsonError("invalid_period", 400);

  const member = await currentMember();
  if (!member) return jsonError("signed_out", 401);

  const { data: plan } = await member.supabase.rpc("my_plan").maybeSingle();
  if (plan?.premium && plan.status === "active") return jsonError("already_premium", 409);

  try {
    const { subscriptionId, keyId } = await createSubscription(period, member.userId);
    const { error } = await member.supabase.rpc("billing_start", { p_subscription_id: subscriptionId, p_period: period });
    if (error) {
      console.error("billing_start", error);
      return jsonError("start_failed", 500);
    }
    return NextResponse.json({ subscriptionId, keyId });
  } catch (error) {
    console.error(error);
    return jsonError("razorpay_failed", 502);
  }
}

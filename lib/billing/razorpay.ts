import type { BillingPeriod } from "@/lib/plans";

/*
 * Razorpay Subscriptions, called only from route handlers (never import this
 * from a client component). Configure in Vercel
 * (server-only variables, never NEXT_PUBLIC_):
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
 *   RAZORPAY_PLAN_MONTHLY (₹79 / month plan id), RAZORPAY_PLAN_YEARLY (₹899 / year plan id)
 * The key secret and webhook secret are also stored in Supabase Vault, where the
 * database uses them to verify payments before switching Premium on.
 */

const API = "https://api.razorpay.com/v1";

function config() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const plans: Record<BillingPeriod, string | undefined> = {
    monthly: process.env.RAZORPAY_PLAN_MONTHLY,
    yearly: process.env.RAZORPAY_PLAN_YEARLY,
  };
  if (!keyId || !keySecret || !plans.monthly || !plans.yearly) return null;
  return { keyId, keySecret, plans: plans as Record<BillingPeriod, string> };
}

export const isRazorpayConfigured = () => config() !== null;

async function call<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const cfg = config();
  if (!cfg) throw new Error("Razorpay is not configured");
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    // Razorpay's error text can include account details: log it, don't return it.
    console.error("Razorpay", path, response.status, await response.text().catch(() => ""));
    throw new Error(`Razorpay request failed (${response.status})`);
  }
  return (await response.json()) as T;
}

/** Starts a recurring subscription; the member authorises it in Razorpay Checkout. */
export async function createSubscription(period: BillingPeriod, userId: string) {
  const cfg = config();
  if (!cfg) throw new Error("Razorpay is not configured");
  const subscription = await call<{ id: string }>("/subscriptions", {
    plan_id: cfg.plans[period],
    // Renew for up to 10 years; members can cancel any time.
    total_count: period === "monthly" ? 120 : 10,
    customer_notify: 1,
    notes: { user_id: userId, period },
  });
  return { subscriptionId: subscription.id, keyId: cfg.keyId };
}

/** Stops renewals; Premium lasts until the end of the period already paid for. */
export async function cancelSubscription(subscriptionId: string) {
  if (!/^sub_[A-Za-z0-9]{6,40}$/.test(subscriptionId)) throw new Error("Invalid subscription id");
  await call(`/subscriptions/${subscriptionId}/cancel`, { cancel_at_cycle_end: 1 });
}

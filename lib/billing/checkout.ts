import type { BillingPeriod } from "@/lib/plans";
import { PREMIUM_PRICES } from "@/lib/plans";
import { getSupabase } from "@/lib/supabase/client";
import { refreshPlan } from "@/lib/storage/plan";

/** What Razorpay Checkout returns after the member authorises the subscription. */
interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", handler: (response: { error?: { description?: string } }) => void): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SCRIPT}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Couldn't load Razorpay")), { once: true });
    if (!existing) {
      script.src = CHECKOUT_SCRIPT;
      script.async = true;
      document.head.append(script);
    }
  });
}

export type CheckoutResult = { ok: true; premiumUntil: string } | { ok: false; message: string; cancelled?: boolean };

const MESSAGES: Record<string, string> = {
  not_configured: "Online payments are being set up. Please try again soon.",
  already_premium: "You already have Premium.",
  signed_out: "Please log in again to upgrade.",
};

/**
 * Opens Razorpay Checkout for a monthly or yearly Premium subscription. When the
 * member pays, the database checks Razorpay's signature and switches Premium on.
 */
export async function startPremiumCheckout(
  period: BillingPeriod,
  member: { name: string; email: string },
): Promise<CheckoutResult> {
  const response = await fetch("/api/billing/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ period }),
  }).catch(() => null);
  if (!response) return { ok: false, message: "You seem to be offline. Check your connection and try again." };
  const data = (await response.json().catch(() => ({}))) as { subscriptionId?: string; keyId?: string; error?: string };
  if (!response.ok || !data.subscriptionId || !data.keyId) {
    return { ok: false, message: MESSAGES[data.error ?? ""] ?? "We couldn't start the payment. Please try again." };
  }

  try {
    await loadCheckoutScript();
  } catch {
    return { ok: false, message: "We couldn't open the payment window. Check your connection and try again." };
  }
  const Razorpay = window.Razorpay;
  if (!Razorpay) return { ok: false, message: "We couldn't open the payment window. Please try again." };

  const price = PREMIUM_PRICES[period];
  return new Promise<CheckoutResult>((resolve) => {
    const checkout = new Razorpay({
      key: data.keyId,
      subscription_id: data.subscriptionId,
      name: "RecipeNest",
      description: `Premium · ₹${price.amount} / ${price.per}`,
      prefill: { name: member.name, email: member.email },
      theme: { color: "#c9a227" },
      modal: { ondismiss: () => resolve({ ok: false, cancelled: true, message: "Payment cancelled." }) },
      handler: async (success: RazorpaySuccess) => {
        const supabase = getSupabase();
        const { data: premiumUntil, error } = supabase
          ? await supabase.rpc("billing_confirm", {
              p_payment_id: success.razorpay_payment_id,
              p_subscription_id: success.razorpay_subscription_id,
              p_signature: success.razorpay_signature,
            })
          : { data: null, error: new Error("offline") };
        await refreshPlan().catch(() => {});
        if (error || !premiumUntil) {
          // The webhook will still activate Premium if the payment went through.
          resolve({
            ok: false,
            message: "Payment received, but we couldn't confirm it yet. Premium will switch on within a few minutes.",
          });
          return;
        }
        resolve({ ok: true, premiumUntil });
      },
    });
    // A failed attempt keeps Checkout open so the member can try another method;
    // closing it resolves through ondismiss.
    checkout.on("payment.failed", (failure) => console.warn("Razorpay payment failed", failure.error?.description));
    checkout.open();
  });
}

/** Stops renewals at the end of the current period. */
export async function cancelPremium(): Promise<{ ok: boolean; message: string }> {
  const response = await fetch("/api/billing/cancel", { method: "POST" }).catch(() => null);
  await refreshPlan().catch(() => {});
  if (response?.ok) return { ok: true, message: "Auto-renew is off. Premium stays active until the end of your current period." };
  return { ok: false, message: "We couldn't cancel right now. Please try again." };
}

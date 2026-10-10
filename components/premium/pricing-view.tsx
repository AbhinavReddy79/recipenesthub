"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Crown, Loader2, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { cancelPremium, startPremiumCheckout } from "@/lib/billing/checkout";
import { formatDate } from "@/lib/format";
import {
  FREE_FEATURES,
  formatRupees,
  PREMIUM_FEATURES,
  PREMIUM_PRICES,
  YEARLY_SAVING,
  type BillingPeriod,
} from "@/lib/plans";
import { usePlan } from "@/lib/storage/plan";
import { cn } from "@/lib/utils";

/** Free vs Premium, with monthly/yearly billing through Razorpay. */
export function PricingView() {
  const hydrated = useHydrated();
  const { user } = useCurrentUser();
  const plan = usePlan();
  const [period, setPeriod] = useState<BillingPeriod>("yearly");
  const [busy, setBusy] = useState(false);
  const price = PREMIUM_PRICES[period];

  const upgrade = async () => {
    if (!user) return;
    setBusy(true);
    const result = await startPremiumCheckout(period, { name: user.name, email: user.email });
    setBusy(false);
    if (result.ok) toast.success(`Welcome to Premium! Active until ${formatDate(result.premiumUntil)}.`);
    else if (!result.cancelled) toast.error(result.message);
  };

  const cancel = async () => {
    setBusy(true);
    const result = await cancelPremium();
    setBusy(false);
    if (result.ok) toast.success(result.message);
    else toast.error(result.message);
  };

  const ready = hydrated && plan.loaded;

  return (
    <div className="grid gap-10">
      {ready && plan.premium && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-metallic-charcoal p-5 text-white shadow-lift ring-1 ring-saffron/40 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-xl bg-metallic-gold text-[oklch(0.2_0.006_70)]">
              <Crown className="size-5" aria-hidden />
            </span>
            <div className="grid">
              <p className="font-display text-xl font-semibold">You&apos;re on Premium</p>
              <p className="text-sm text-white/75">
                {plan.premiumUntil && `Active until ${formatDate(plan.premiumUntil)}`}
                {plan.status === "active" && " · renews automatically"}
                {plan.status === "cancelled" && " · auto-renew is off"}
                {plan.status === "granted" && " · gifted by RecipeNest"}
              </p>
            </div>
          </div>
          {plan.hasRazorpay && plan.status === "active" && (
            <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" disabled={busy} onClick={cancel}>
              Turn off auto-renew
            </Button>
          )}
        </div>
      )}

      <div className="flex justify-center">
        <div role="group" aria-label="Billing period" className="inline-flex rounded-full bg-card p-1 shadow-soft ring-1 ring-border">
          {(["monthly", "yearly"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={period === value}
              onClick={() => setPeriod(value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors",
                period === value ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {PREMIUM_PRICES[value].label}
              {value === "yearly" && (
                <span className={cn("rounded-full px-2 py-0.5 text-[0.6875rem]", period === value ? "bg-white/20" : "bg-herb-soft text-herb")}>
                  Save {formatRupees(YEARLY_SAVING)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
        {/* Free */}
        <section aria-labelledby="plan-free" className="flex flex-col gap-6 rounded-3xl border bg-card p-6 shadow-card sm:p-8">
          <div className="grid gap-2">
            <h2 id="plan-free" className="text-2xl font-semibold">
              Free
            </h2>
            <p className="text-muted-foreground">Everything you need to cook, plan and share.</p>
          </div>
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-5xl font-semibold">₹0</span>
            <span className="text-muted-foreground">forever</span>
          </p>
          <FeatureList items={FREE_FEATURES} />
          <Button variant="outline" size="lg" className="mt-auto" disabled>
            {ready && !plan.premium ? "Your current plan" : "Included"}
          </Button>
        </section>

        {/* Premium */}
        <section
          aria-labelledby="plan-premium"
          className="relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-metallic-charcoal p-6 text-white shadow-lift ring-2 ring-saffron/60 sm:p-8"
        >
          <span className="absolute top-5 right-5 inline-flex items-center gap-1 rounded-full bg-metallic-gold px-3 py-1 text-xs font-bold text-[oklch(0.2_0.006_70)] uppercase">
            <Sparkles className="size-3.5" aria-hidden />
            Most popular
          </span>
          <div className="grid gap-2">
            <h2 id="plan-premium" className="flex items-center gap-2 text-2xl font-semibold">
              <Crown className="size-6 text-gold-light" aria-hidden />
              Premium
            </h2>
            <p className="text-white/75">For cooks who share a lot and love a challenge.</p>
          </div>
          <p className="flex items-baseline gap-1.5">
            <span className="font-display text-5xl font-semibold text-gold-light">{formatRupees(price.amount)}</span>
            <span className="text-white/70">/ {price.per}</span>
          </p>
          {period === "yearly" && (
            <p className="-mt-4 text-sm text-white/70">
              Just {formatRupees(Math.round(price.amount / 12))} a month, billed yearly.
            </p>
          )}
          <FeatureList items={PREMIUM_FEATURES} onDark />
          {ready && plan.premium ? (
            <Button size="lg" className="mt-auto bg-metallic-gold text-[oklch(0.2_0.006_70)] hover:opacity-95" disabled>
              <Crown data-icon="inline-start" />
              You have Premium
            </Button>
          ) : (
            <Button
              size="lg"
              className="mt-auto bg-metallic-gold text-[oklch(0.2_0.006_70)] hover:opacity-95"
              disabled={!ready || busy}
              onClick={upgrade}
            >
              {busy ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Crown data-icon="inline-start" />}
              Get Premium · {formatRupees(price.amount)} / {price.per}
            </Button>
          )}
          <p className="text-center text-xs text-white/60">
            Secure payment by Razorpay: UPI, cards and net banking. Cancel auto-renew anytime.
          </p>
        </section>
      </div>

      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
        <Trophy className="size-5 text-gold-ink" aria-hidden />
        Premium members can enter the weekly cooking contest for cash prizes.
        <Link href="/contests" className="font-semibold text-primary underline-offset-4 hover:underline">
          See this week&apos;s contest
        </Link>
      </div>
    </div>
  );
}

function FeatureList({ items, onDark = false }: { items: string[]; onDark?: boolean }) {
  return (
    <ul className="grid gap-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2.5">
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
              onDark ? "bg-gold-light/20 text-gold-light" : "bg-herb-soft text-herb",
            )}
          >
            <Check className="size-3.5" aria-hidden />
          </span>
          <span className={onDark ? "text-white/90" : undefined}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

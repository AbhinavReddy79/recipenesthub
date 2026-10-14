"use client";

import Link from "next/link";
import { Check, Clover, Crown, Gift, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatDate } from "@/lib/format";
import { DRAW_PREMIUM_MONTHS, FREE_FEATURES, PREMIUM_FEATURES, WELCOME_PREMIUM_MONTHS } from "@/lib/plans";
import { usePlan } from "@/lib/storage/plan";
import { cn } from "@/lib/utils";

/** Free vs Premium. Premium can't be bought: it's won in the weekly lucky draw or the contest. */
export function PricingView() {
  const hydrated = useHydrated();
  const { user } = useCurrentUser();
  const plan = usePlan();
  const ready = hydrated && plan.loaded;

  return (
    <div className="grid gap-10">
      {ready && plan.premium && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-metallic-charcoal p-5 text-white shadow-lift ring-1 ring-saffron/40 sm:p-6">
          <span className="flex size-11 items-center justify-center rounded-xl bg-metallic-gold text-[oklch(0.2_0.006_70)]">
            <Crown className="size-5" aria-hidden />
          </span>
          <div className="grid">
            <p className="font-display text-xl font-semibold">You have Premium</p>
            <p className="text-sm text-white/75">{plan.premiumUntil && `Active until ${formatDate(plan.premiumUntil)}`}</p>
          </div>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <section aria-labelledby="plan-free" className="flex flex-col gap-6 rounded-3xl border bg-card p-6 shadow-card sm:p-8">
          <div className="grid gap-2">
            <h2 id="plan-free" className="text-2xl font-semibold">
              Free
            </h2>
            <p className="text-muted-foreground">Everything you need to cook, plan and share.</p>
          </div>
          <p className="font-display text-5xl font-semibold">₹0</p>
          <FeatureList items={FREE_FEATURES} />
          {hydrated && !user ? (
            <Button asChild variant="outline" size="lg" className="mt-auto">
              <Link href="/register">Join free</Link>
            </Button>
          ) : (
            <Button variant="outline" size="lg" className="mt-auto" disabled>
              {ready && !plan.premium ? "Your current plan" : "Included"}
            </Button>
          )}
        </section>

        <section
          aria-labelledby="plan-premium"
          className="relative flex flex-col gap-6 overflow-hidden rounded-3xl bg-metallic-charcoal p-6 text-white shadow-lift ring-2 ring-saffron/60 sm:p-8"
        >
          <span className="absolute top-5 right-5 inline-flex items-center gap-1 rounded-full bg-metallic-gold px-3 py-1 text-xs font-bold text-[oklch(0.2_0.006_70)] uppercase">
            <Clover className="size-3.5" aria-hidden />
            Win it
          </span>
          <div className="grid gap-2">
            <h2 id="plan-premium" className="flex items-center gap-2 text-2xl font-semibold">
              <Crown className="size-6 text-gold-light" aria-hidden />
              Premium
            </h2>
            <p className="text-white/75">Not for sale. New members get it free for {WELCOME_PREMIUM_MONTHS} month, then win more in the weekly lucky draw.</p>
          </div>
          <p className="font-display text-3xl font-semibold text-gold-light">{DRAW_PREMIUM_MONTHS} months free</p>
          <FeatureList items={PREMIUM_FEATURES} onDark />
          <Button asChild size="lg" className="mt-auto bg-metallic-gold text-[oklch(0.2_0.006_70)] hover:opacity-95">
            <Link href={hydrated && !user ? "/login?next=/lucky-draw" : "/lucky-draw"}>
              <Clover data-icon="inline-start" />
              Join the lucky draw
            </Link>
          </Button>
        </section>
      </div>

      <section aria-labelledby="how-to-win" className="mx-auto grid w-full max-w-4xl gap-4">
        <h2 id="how-to-win" className="text-center text-2xl font-semibold">
          How to get Premium
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <WayCard
            icon={<Crown />}
            title={`${WELCOME_PREMIUM_MONTHS} month free when you join`}
            text="Every new member starts with Premium for their first month, automatically. No card, no payment."
            href={hydrated && !user ? "/register" : "/lucky-draw"}
            cta={hydrated && !user ? "Join free" : "Keep it going: join the draw"}
          />
          <WayCard
            icon={<Gift />}
            title="Weekly lucky draw"
            text={`Every week, join the draw with one click. Winners get ${DRAW_PREMIUM_MONTHS} months of Premium, plus a cash prize in some weeks.`}
            href="/lucky-draw"
            cta="See this week's draw"
          />
          <WayCard
            icon={<Trophy />}
            title="Weekly cooking contest"
            text="Premium members enter their best recipe for the theme. The most-voted recipes win a cash prize and a free month."
            href="/contests"
            cta="See the contest"
          />
        </div>
      </section>
    </div>
  );
}

function WayCard({ icon, title, text, href, cta }: { icon: React.ReactNode; title: string; text: string; href: string; cta: string }) {
  return (
    <div className="grid content-start gap-3 rounded-2xl border bg-card p-5 shadow-soft">
      <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground [&_svg]:size-5">{icon}</span>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link href={href} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
        {cta}
      </Link>
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

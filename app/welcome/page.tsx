import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Check, Crown, Map, ShoppingBasket, Sparkles, Trophy, Utensils } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { unsplash } from "@/lib/images";
import { DRAW_PREMIUM_MONTHS, FREE_RECIPES_PER_MONTH } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Welcome",
  description:
    "RecipeNest: recipes from every Indian state and kitchens around the world, a meal planner, smart shopping lists and a weekly cooking contest.",
};

const FEATURES = [
  { icon: Map, title: "Every Indian state", text: "Pick a state and cook its breakfast, lunch, snacks and dinner, from Kashmir to Kerala." },
  { icon: Utensils, title: "Kitchens of the world", text: "Italian, Mexican, Chinese, Japanese, Thai, Korean, Mediterranean and more, region by region." },
  { icon: CalendarDays, title: "Plan your week", text: "Drag recipes into a weekly meal plan and adjust servings for your family." },
  { icon: ShoppingBasket, title: "Smart shopping lists", text: "Turn your plan into one combined shopping list, with quantities scaled to your servings." },
  { icon: Sparkles, title: "Share your recipes", text: "Publish your own recipes with photos, and save and review your favourites." },
  { icon: Trophy, title: "Weekly contest", text: "Premium cooks compete on a new theme every week. Members vote and the winner gets a cash prize." },
];

/**
 * What signed-out visitors see at the site's address after launch (the proxy
 * shows it at "/"). It covers the whole screen with its own header and footer.
 */
export default function WelcomePage() {
  return (
    <div className="fixed inset-0 z-[100] overflow-x-hidden overflow-y-auto bg-background">
      <header className="dark sticky top-0 z-10 border-b border-white/10 bg-ink/95 text-white">
        <div className="container-page flex h-16 items-center justify-between gap-3">
          <Link href="/" aria-label="RecipeNest home" className="group/logo rounded-lg">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex">
              <Link href="/pricing">Premium</Link>
            </Button>
            <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="bg-metallic-gold text-[oklch(0.2_0.006_70)] hover:opacity-95">
              <Link href="/register">Join free</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="dark relative isolate overflow-hidden bg-ink text-white">
        <Image src={unsplash("1504674900247-0877df9cc836", 2000)} alt="" fill priority sizes="100vw" className="-z-20 object-cover" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/65 to-black/30" />
        <div className="container-page grid max-w-3xl gap-6 py-20 sm:py-28">
          <p className="w-fit rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-medium">
            Tested recipes · Meal planner · Weekly contest
          </p>
          <h1 className="text-balance text-5xl leading-[1.03] font-semibold sm:text-7xl">
            Cook something <span className="text-gradient-gold">you&apos;ll love.</span>
          </h1>
          <p className="max-w-xl text-pretty text-lg text-white/85">
            Recipes from every Indian state and kitchens around the world, a weekly meal planner and smart shopping lists,
            all in one place. Free to join.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-metallic-gold text-[oklch(0.2_0.006_70)] hover:opacity-95">
              <Link href="/register">Create your free account</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="features" className="container-page grid gap-8 py-16 sm:py-20">
        <h2 id="features" className="text-center text-[2.375rem] leading-tight font-semibold">
          Everything for your kitchen
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="grid gap-2 rounded-2xl bg-card p-5 shadow-card ring-1 ring-border/70">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="plans" className="bg-warm-glow">
        <div className="container-page grid gap-8 py-16 sm:py-20">
          <h2 id="plans" className="text-center text-[2.375rem] leading-tight font-semibold">
            Free to join. Premium to win.
          </h2>
          <div className="mx-auto grid w-full max-w-3xl gap-5 sm:grid-cols-2">
            <div className="grid gap-3 rounded-3xl bg-card p-6 shadow-card ring-1 ring-border/70">
              <h3 className="text-xl font-semibold">Free</h3>
              <p className="font-display text-4xl font-semibold">₹0</p>
              <ul className="grid gap-2 text-sm">
                {["Every recipe, cuisine and state", "Meal planner and shopping lists", `Publish ${FREE_RECIPES_PER_MONTH} recipes a month`, "Join the weekly lucky draw"].map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="size-4 shrink-0 text-herb" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="dark grid gap-3 rounded-3xl bg-metallic-charcoal p-6 text-white shadow-lift ring-2 ring-saffron/60">
              <h3 className="flex items-center gap-2 text-xl font-semibold">
                <Crown className="size-5 text-gold-light" aria-hidden />
                Premium
              </h3>
              <p className="font-display text-4xl font-semibold text-gold-light">Not for sale</p>
              <p className="-mt-2 text-sm text-white/70">Win {DRAW_PREMIUM_MONTHS} months free in the weekly lucky draw</p>
              <ul className="grid gap-2 text-sm">
                {["Everything in Free", "Unlimited recipes", "Enter the weekly contest", "Lucky draw winners also get cash"].map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="size-4 shrink-0 text-gold-light" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-center text-sm">
            <Link href="/pricing" className="font-semibold text-primary underline-offset-4 hover:underline">
              How to win Premium
            </Link>
          </p>
        </div>
      </section>

      <footer className="dark bg-ink text-white/70">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-8 text-sm">
          <p>© {new Date().getFullYear()} RecipeNest</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/pricing" className="hover:text-white">Premium</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/contact" className="hover:text-white">Contact us</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

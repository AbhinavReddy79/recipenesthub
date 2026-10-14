import Link from "next/link";
import { BadgeCheck, ChefHat, Clover, Crown, Heart, ShieldCheck, UserCheck } from "lucide-react";

const RULES = [
  {
    icon: UserCheck,
    title: "Be a RecipeNest member",
    text: "Sign in with your own account in good standing. One account per person.",
  },
  {
    icon: Crown,
    title: "Have Premium",
    text: "Only Premium members can enter. Premium isn't sold: win it in the weekly lucky draw.",
    link: { href: "/lucky-draw", label: "Join the lucky draw" },
  },
  {
    icon: ChefHat,
    title: "Enter your own published recipe",
    text: "Pick a recipe that you created and published yourself and that fits the week's theme.",
  },
  {
    icon: BadgeCheck,
    title: "One entry per contest",
    text: "Each member can enter one recipe per contest while it's open. You can withdraw it and enter another before it closes.",
  },
  {
    icon: Heart,
    title: "Votes decide the winners",
    text: "Every member can vote once per entry. The most-voted entry wins. When a contest has 2 winners, the second most-voted entry wins too. A tie goes to the earlier entry.",
  },
  {
    icon: ShieldCheck,
    title: "Play fair",
    text: "Copied recipes, off-theme entries, fake accounts or vote trading are removed and can be disqualified.",
  },
];

/** Who can take part in the weekly contest, matching the rules the database enforces. */
export function ContestEligibility() {
  return (
    <section aria-labelledby="eligibility-heading" className="grid gap-6 rounded-[2rem] border bg-card p-6 shadow-card sm:p-10">
      <div className="grid gap-2">
        <p className="text-xs font-bold tracking-[0.16em] text-gold-ink uppercase">Eligibility</p>
        <h2 id="eligibility-heading" className="text-[1.75rem] leading-tight font-semibold">
          Who can take part
        </h2>
        <p className="max-w-2xl text-muted-foreground">
          Everyone can browse and vote. To enter a recipe, you need to meet all of these:
        </p>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RULES.map(({ icon: Icon, title, text, link }, index) => (
          <li key={title} className="flex gap-3 rounded-2xl bg-muted/50 p-4 ring-1 ring-border/60">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="grid content-start gap-1">
              <h3 className="font-semibold">
                <span className="text-muted-foreground tabular-nums">{index + 1}.</span> {title}
              </h3>
              <p className="text-sm text-muted-foreground">{text}</p>
              {link && (
                <Link href={link.href} className="inline-flex items-center gap-1 text-sm font-semibold text-primary underline-offset-4 hover:underline">
                  <Clover className="size-4" aria-hidden />
                  {link.label}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted-foreground">
        Each winner gets the cash prize shown for that week plus one free month of Premium. Cash prizes are paid after we contact the winners by
        email. Full rules are in our{" "}
        <Link href="/terms" className="font-semibold text-primary underline-offset-4 hover:underline">
          Terms
        </Link>
        .
      </p>
    </section>
  );
}

import Link from "next/link";
import { features, siteConfig } from "@/lib/site";
import { Logo } from "./logo";
import { NewsletterForm } from "./newsletter-form";

const columns = [
  {
    title: "Explore",
    links: [
      { label: "Browse recipes", href: "/recipes" },
      { label: "Cuisines", href: "/cuisines" },
      { label: "Cook with what you have", href: "/ingredients" },
      { label: "Community", href: "/community" },
    ],
  },
  {
    title: "Plan",
    links: [
      { label: "Meal planner", href: "/meal-planner" },
      { label: "Shopping list", href: "/shopping-list" },
      { label: "Collections", href: "/collections" },
      { label: "Saved recipes", href: "/saved" },
    ],
  },
  {
    title: "Create",
    links: [
      { label: "Share a recipe", href: "/recipes/create" },
      { label: "My recipes", href: "/my-recipes" },
      { label: "Profile", href: "/profile" },
      { label: "Settings", href: "/settings" },
    ],
  },
];

/** Always dark (the `dark` class scopes the dark tokens to the footer). */
export function Footer() {
  return (
    <footer className="dark band-charcoal relative isolate mt-auto overflow-hidden bg-ink text-foreground">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(40%_60%_at_40%_0%,color-mix(in_oklch,var(--saffron)_10%,transparent),transparent)]"
      />
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.2fr_2fr] lg:gap-20">
        <div className="grid content-start gap-6">
          <Link href="/" className="w-fit rounded-lg" aria-label="RecipeNest home">
            <Logo />
          </Link>
          <p className="max-w-sm text-pretty text-[0.9375rem] leading-relaxed text-muted-foreground">
            {siteConfig.description}
          </p>
          {features.newsletter && (
            <div className="max-w-sm rounded-2xl bg-card p-5 ring-1 ring-border">
              <NewsletterForm />
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="grid content-start gap-4">
              <h2 className="font-sans text-xs font-bold tracking-[0.16em] text-saffron uppercase">{column.title}</h2>
              <ul className="grid gap-0.5 sm:gap-1">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1.5 text-[0.9375rem] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t">
        <div className="container-page flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} RecipeNest. Made for people who love to cook.</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>Your account and plans sync securely across your devices.</span>
            <Link href="/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
              Privacy
            </Link>
            <Link href="/contact" className="underline-offset-4 hover:text-foreground hover:underline">
              Contact
            </Link>
            <Link href="/pricing" className="underline-offset-4 hover:text-foreground hover:underline">
              Premium
            </Link>
            <Link href="/lucky-draw" className="underline-offset-4 hover:text-foreground hover:underline">
              Lucky draw
            </Link>
            <Link href="/terms" className="underline-offset-4 hover:text-foreground hover:underline">
              Terms
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

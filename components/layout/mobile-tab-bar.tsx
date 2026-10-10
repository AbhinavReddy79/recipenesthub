"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Heart, Home, Search, ShoppingBasket } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { isPublicPath } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recipes", label: "Recipes", icon: Search },
  { href: "/meal-planner", label: "Planner", icon: CalendarDays },
  { href: "/shopping-list", label: "Shopping", icon: ShoppingBasket },
  { href: "/saved", label: "Saved", icon: Heart },
] as const;

/** App-style tab bar for phones; hidden from tablet width up, where the top navigation has room. */
export function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  // Public pages (sign-in, legal, pricing) are what signed-out visitors see; the tabs lead behind the login.
  if (isPublicPath(pathname) && !user) return null;
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-3 bottom-[calc(0.625rem+env(safe-area-inset-bottom))] z-40 rounded-[1.75rem] border border-white/70 bg-card/95 shadow-[0_12px_32px_-12px_oklch(0.2_0.004_70/0.28),0_2px_6px_-2px_oklch(0.2_0.003_70/0.08)] pointer-fine:bg-card/80 pointer-fine:backdrop-blur-xl pointer-fine:backdrop-saturate-150 md:hidden print:hidden dark:border-white/10 dark:bg-card/95 dark:pointer-fine:bg-card/85"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-[3.75rem] flex-col items-center justify-center gap-0.5 text-[0.6875rem] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300",
                    active ? "bg-accent text-accent-foreground shadow-[inset_0_1px_2px_oklch(0.25_0.03_70/0.1)]" : "group-active:scale-90",
                  )}
                >
                  <Icon className={cn("size-5", active && href === "/saved" && "fill-current")} strokeWidth={active ? 2.25 : 1.9} aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

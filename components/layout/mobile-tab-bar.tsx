"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Heart, Home, Search, ShoppingBasket } from "lucide-react";
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
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/85 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-12px_oklch(0.25_0.03_170/0.25)] backdrop-blur-xl backdrop-saturate-150 md:hidden print:hidden"
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
                  "group flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300",
                    active ? "bg-primary/12 scale-105" : "group-active:scale-90",
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

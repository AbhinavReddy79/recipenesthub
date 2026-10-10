"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/hooks/use-hydrated";
import { isPublicPath } from "@/lib/auth-routes";
import { useCurrentUser } from "@/hooks/use-current-user";
import { mainNav } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { SearchCommand } from "./search-command";
import { UserMenu } from "./user-menu";

export function Navbar() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { openAuth } = useAuthDialog();
  const hydrated = useHydrated();
  const [scrolled, setScrolled] = useState(false);
  // Before signing in only the public pages are reachable, so keep the header to the logo.
  const guest = !user && isPublicPath(pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-background/95 transition-shadow duration-300 pointer-fine:bg-background/80 pointer-fine:backdrop-blur-xl pointer-fine:backdrop-saturate-150 pointer-fine:supports-[backdrop-filter]:bg-background/70",
        scrolled ? "border-border/70 shadow-card" : "border-transparent",
      )}
    >
      <div className="container-page flex h-[4.25rem] items-center gap-2">
        {!guest && <MobileNav />}
        <Link href="/" className="group/logo mr-2 rounded-lg focus-visible:outline-offset-4" aria-label="RecipeNest home">
          <Logo animated={pathname === "/" || pathname === "/admin"} />
        </Link>

        <nav aria-label="Main" className={cn("ml-4 hidden items-center gap-0.5", !guest && "lg:flex")}>
          {mainNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-3.5 py-2 text-[0.9375rem] whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary/10 font-semibold text-primary"
                    : "font-medium text-foreground/70 hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {guest ? (
          <div className="ml-auto">
            <Button asChild variant={pathname === "/login" ? "default" : "outline"}>
              <Link href={pathname === "/login" ? "/register" : "/login"}>
                {pathname === "/login" ? "Create account" : "Log in"}
              </Link>
            </Button>
          </div>
        ) : (
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <SearchCommand />

          {hydrated && user ? (
            <Button asChild className="hidden xl:inline-flex">
              <Link href="/recipes/create">
                <Plus data-icon="inline-start" />
                Share a recipe
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" className="hidden font-semibold sm:inline-flex" onClick={() => openAuth("login")}>
              Sign in
            </Button>
          )}

          <div className="ml-1">
            <UserMenu />
          </div>
        </div>
        )}
      </div>
    </header>
  );
}

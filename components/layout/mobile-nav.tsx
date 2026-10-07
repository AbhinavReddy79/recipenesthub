"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus } from "lucide-react";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCurrentUser } from "@/hooks/use-current-user";
import { mainNav } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { accountLinks } from "./user-menu";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { openAuth } = useAuthDialog();
  const { user } = useCurrentUser();

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.9375rem] transition-colors hover:bg-muted",
      (href === "/" ? pathname === "/" : pathname.startsWith(href)) ? "bg-muted font-medium text-foreground" : "text-foreground",
    );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[86%] max-w-sm gap-0 overflow-y-auto p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle asChild>
            <Link href="/" onClick={() => setOpen(false)} className="w-fit">
              <Logo />
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>

        <nav aria-label="Mobile" className="grid gap-1 p-3">
          <Link href="/" className={linkClass("/")} onClick={() => setOpen(false)}>
            Home
          </Link>
          {mainNav.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link href="/community" className={linkClass("/community")} onClick={() => setOpen(false)}>
            Community
          </Link>
        </nav>

        <Separator />

        <div className="grid gap-1 p-3">
          <p className="px-3 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Your kitchen
          </p>
          {accountLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={linkClass(href)} onClick={() => setOpen(false)}>
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </Link>
          ))}
        </div>

        <div className="mt-auto grid gap-2 border-t p-4">
          <Button asChild size="lg" onClick={() => setOpen(false)}>
            <Link href="/recipes/create">
              <Plus />
              Create a recipe
            </Link>
          </Button>
          {!user && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setOpen(false);
                  openAuth("login");
                }}
              >
                Log in
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setOpen(false);
                  openAuth("register");
                }}
              >
                Create profile
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

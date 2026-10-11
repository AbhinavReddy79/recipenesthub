"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Clover, Inbox, LayoutDashboard, MessageSquareText, Trophy, Users } from "lucide-react";
import { useAdminPowers } from "@/lib/storage/admin-powers";
import { cn } from "@/lib/utils";
import { SECTION_POWER } from "./admin-gate";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/recipes", label: "Recipes", icon: BookOpen },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/contests", label: "Contests", icon: Trophy },
  { href: "/admin/draws", label: "Lucky draws", icon: Clover },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
];

export function AdminNav() {
  const pathname = usePathname();
  const powers = useAdminPowers();
  const links = LINKS.filter(({ href }) => !SECTION_POWER[href] || powers[SECTION_POWER[href]]);
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 scrollbar-none lg:mx-0 lg:px-0">
      <ul className="flex gap-1 lg:grid">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

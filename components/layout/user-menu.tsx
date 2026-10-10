"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CircleUser,
  Crown,
  FolderHeart,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
  ShoppingBasket,
  User,
  UserPlus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { authClient } from "@/lib/auth";
import { usePlan } from "@/lib/storage/plan";
import { THEME_OPTIONS } from "./theme-toggle";

export const accountLinks = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/saved", label: "Saved Recipes", icon: Heart },
  { href: "/my-recipes", label: "My Recipes", icon: BookOpen },
  { href: "/collections", label: "Collections", icon: FolderHeart },
  { href: "/shopping-list", label: "Shopping List", icon: ShoppingBasket },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function UserMenu() {
  const hydrated = useHydrated();
  const { user, isAdmin } = useCurrentUser();
  const plan = usePlan();
  const { openAuth } = useAuthDialog();
  const signedIn = hydrated && user;
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        aria-label={signedIn ? `Account menu for ${user.name}` : "Account menu"}
      >
        {signedIn ? (
          <UserAvatar name={user.name} src={user.avatar} className="size-9" />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <CircleUser className="size-5" aria-hidden />
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {signedIn ? (
          <>
            <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 font-normal">
              <UserAvatar name={user.name} src={user.avatar} className="size-10" />
              <span className="grid min-w-0">
                <span className="truncate text-sm font-semibold text-foreground">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">@{user.username}</span>
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/pricing" className="font-semibold">
                <Crown className="text-gold-ink" />
                {plan.premium ? "Premium" : "Go Premium"}
                {plan.premium && (
                  <span className="ml-auto rounded-full bg-metallic-gold px-2 py-0.5 text-[0.625rem] font-bold text-[oklch(0.2_0.006_70)] uppercase">
                    Active
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {accountLinks.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href}>
                    <Icon />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {isAdmin && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <LayoutDashboard />
                    Admin dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onSelect={async () => {
                await authClient.signOut();
                toast("You've been signed out.");
                // The site is members-only, so head back to the login screen.
                router.replace("/login");
                router.refresh();
              }}
            >
              <LogOut />
              Sign out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="px-2 py-2 text-xs font-normal text-muted-foreground">
              Create a free profile to save recipes, build collections and plan meals.
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => openAuth("register")}>
              <UserPlus />
              Create profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => openAuth("login")}>
              <LogIn />
              Log in
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings />
                Settings
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Appearance</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme ?? "light"} onValueChange={setTheme}>
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value}>
              <Icon className="text-muted-foreground" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

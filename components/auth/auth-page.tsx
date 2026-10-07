"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, CircleAlert, Heart, MailCheck, Users } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { unsplash } from "@/lib/images";
import { AuthSuccess } from "./auth-success";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";

const PERKS = [
  { text: "Save recipes and build collections", icon: Heart, tone: "red" },
  { text: "Plan your week and generate a shopping list", icon: CalendarDays, tone: "herb" },
  { text: "Share your own recipes with the community", icon: Users, tone: "amber" },
] as const;

const COPY = {
  login: { title: "Welcome back", subtitle: "Log in to your saved recipes, collections and meal plans.", image: "1556910103-1c02745aae4d" },
  register: { title: "Create your account", subtitle: "Join a community of home cooks. It only takes a minute.", image: "1556909114-f6e7ad7d3136" },
};

/** `error` comes from the email-link callback (e.g. an expired confirmation link). */
export function AuthPage({ mode, error }: { mode: "login" | "register"; error?: string }) {
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const copy = COPY[mode];

  return (
    <div className="grid flex-1 lg:grid-cols-2">
      <div className="relative isolate hidden overflow-hidden bg-ink lg:block">
        <Image src={unsplash(copy.image, 1400)} alt="" fill priority sizes="50vw" className="-z-20 animate-ken-burns object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
        <div className="absolute inset-x-10 bottom-10 grid gap-5 text-white">
          <p className="max-w-md font-display text-4xl leading-tight font-semibold text-balance text-shadow-lg animate-rise">
            Everything you cook, <span className="text-gradient-gold text-shadow-none">organised</span> in one place.
          </p>
          <ul className="grid max-w-md gap-2.5 text-sm">
            {PERKS.map(({ text, icon: Icon, tone }, i) => (
              <li
                key={text}
                data-tone={tone}
                className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 font-medium backdrop-blur-md animate-rise"
                style={{ animationDelay: `${200 + i * 120}ms` }}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-tone text-tone-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relative isolate flex items-center justify-center overflow-hidden bg-warm-glow px-4 py-12 sm:px-6">
        <div aria-hidden className="absolute inset-0 -z-10 bg-dots opacity-60 [mask-image:radial-gradient(closest-side,black,transparent)]" />
        <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-lift ring-1 ring-border/70 animate-rise sm:p-8">
          {confirmEmail ? (
            <AuthSuccess
              icon={<MailCheck aria-hidden />}
              title="Check your inbox"
              description={`We sent a confirmation link to ${confirmEmail}. Open it to finish creating your profile, then you'll be signed in.`}
              actions={
                <Button asChild variant="outline" size="lg">
                  <Link href="/recipes">Browse recipes meanwhile</Link>
                </Button>
              }
            />
          ) : success ? (
            <AuthSuccess
              title={mode === "login" ? "You're signed in" : `Welcome, ${success.split(" ")[0]}!`}
              description="Your profile is ready. Your saved recipes, collections and plans are kept with your account on every device."
              actions={
                <>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/recipes">Discover recipes</Link>
                  </Button>
                  <Button asChild size="lg">
                    <Link href="/profile">Go to my profile</Link>
                  </Button>
                </>
              }
            />
          ) : (
            <div className="grid gap-8">
              <div className="grid justify-items-start gap-4">
                <Logo />
                <div className="grid gap-1.5">
                  <h1 className="text-3xl font-semibold sm:text-4xl">{copy.title}</h1>
                  <p className="text-muted-foreground">{copy.subtitle}</p>
                </div>
              </div>
              {error && (
                <p role="alert" className="flex gap-2.5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  {error}
                </p>
              )}
              {mode === "login" ? (
                <LoginForm
                  onSuccess={setSuccess}
                  switchToRegister={
                    <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                      Create an account
                    </Link>
                  }
                />
              ) : (
                <RegisterForm
                  onSuccess={(name, email) => (email ? setConfirmEmail(email) : setSuccess(name))}
                  switchToLogin={
                    <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                      Log in
                    </Link>
                  }
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

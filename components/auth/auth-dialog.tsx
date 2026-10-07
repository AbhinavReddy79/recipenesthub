"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { AuthSuccess } from "./auth-success";
import { Logo } from "@/components/layout/logo";

type AuthMode = "login" | "register";

interface AuthDialogContextValue {
  /** Opens login/sign-up; `reason` explains why (e.g. "Create a profile to save recipes"). */
  openAuth: (mode: AuthMode, reason?: string) => void;
}

const AuthDialogContext = createContext<AuthDialogContextValue | null>(null);

export function useAuthDialog(): AuthDialogContextValue {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) throw new Error("useAuthDialog must be used inside <AuthDialogProvider>");
  return ctx;
}

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);

  const openAuth = useCallback((next: AuthMode, why?: string) => {
    setReason(why ?? null);
    setMode(next);
    setSuccess(null);
    setConfirmEmail(null);
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openAuth }), [openAuth]);

  const switchLink = (target: AuthMode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(target)}
      className="font-medium text-primary underline-offset-4 hover:underline"
    >
      {label}
    </button>
  );

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-md sm:p-8">
          {confirmEmail ? (
            <>
              <DialogTitle className="sr-only">Confirm your email</DialogTitle>
              <DialogDescription className="sr-only">A confirmation link has been sent to your email.</DialogDescription>
              <AuthSuccess
                icon={<MailCheck aria-hidden />}
                title="Check your inbox"
                description={`We sent a confirmation link to ${confirmEmail}. Open it to finish creating your profile, then you'll be signed in.`}
                actions={<Button onClick={() => setOpen(false)}>Got it</Button>}
              />
            </>
          ) : success ? (
            <>
              <DialogTitle className="sr-only">Signed in</DialogTitle>
              <DialogDescription className="sr-only">You are now signed in.</DialogDescription>
              <AuthSuccess
                title={mode === "login" ? `Welcome back, ${success.split(" ")[0]}!` : `Welcome, ${success.split(" ")[0]}!`}
                description={
                  mode === "login"
                    ? "You're signed in. Your saved recipes, collections and plans are right where you left them."
                    : "Your profile is ready. Your cookbook, collections and meal plan start fresh — save your first recipe to begin."
                }
                actions={
                  <>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                      Keep browsing
                    </Button>
                    <Button asChild onClick={() => setOpen(false)}>
                      <Link href="/profile">Go to my profile</Link>
                    </Button>
                  </>
                }
              />
            </>
          ) : (
            <>
              <DialogHeader className="items-center gap-3 text-center">
                <Logo showWordmark={false} className="size-10" />
                <DialogTitle className="text-2xl font-semibold">
                  {mode === "login" ? "Welcome back" : "Join RecipeNest"}
                </DialogTitle>
                <DialogDescription>
                  {reason ??
                    (mode === "login"
                      ? "Log in to pick up where you left off."
                      : "Create a free profile to save recipes, build collections and plan your week.")}
                </DialogDescription>
              </DialogHeader>
              {mode === "login" ? (
                <LoginForm
                  idPrefix="dialog-login"
                  onSuccess={(name) => setSuccess(name)}
                  switchToRegister={switchLink("register", "Create an account")}
                />
              ) : (
                <RegisterForm
                  idPrefix="dialog-register"
                  onSuccess={(name, email) => (email ? setConfirmEmail(email) : setSuccess(name))}
                  switchToLogin={switchLink("login", "Log in")}
                />
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  );
}

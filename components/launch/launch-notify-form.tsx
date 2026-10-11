"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import { BellRing, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateEmail } from "@/lib/validation";
import { joinWaitlist } from "@/lib/storage/waitlist";

// Remembers in this browser that the visitor already signed up (just to show the thank-you again).
const STORAGE_KEY = "recipenest:launch-notify";
const listeners = new Set<() => void>();
const readSaved = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const save = (email: string | null) => {
  try {
    if (email) window.localStorage.setItem(STORAGE_KEY, email);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode): the thank-you just won't persist.
  }
  listeners.forEach((listener) => listener());
};

/** Countdown page: leave an email and we'll tell you when RecipeNest opens. */
export function LaunchNotifyForm() {
  const saved = useSyncExternalStore(subscribe, readSaved, () => null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [sending, setSending] = useState(false);
  const [justJoined, setJustJoined] = useState<string | null>(null);
  const joined = justJoined ?? saved;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const problem = validateEmail(email);
    setError(problem);
    if (problem) return;
    setSending(true);
    const result = await joinWaitlist(email);
    setSending(false);
    if (!result.ok) return setError(result.error);
    const clean = email.trim().toLowerCase();
    setJustJoined(clean);
    save(clean);
    setEmail("");
  };

  if (joined) {
    return (
      <div role="status" className="mx-auto grid w-full max-w-md justify-items-center gap-2 rounded-2xl bg-white/[0.07] p-5 ring-1 ring-white/15">
        <MailCheck className="size-7 text-saffron" aria-hidden />
        <p className="font-semibold">You&apos;re on the list!</p>
        <p className="text-sm text-white/75">
          We&apos;ll email <strong className="text-white">{joined}</strong> the moment RecipeNest opens.
        </p>
        <button
          type="button"
          className="text-xs text-white/60 underline-offset-4 hover:text-white hover:underline"
          onClick={() => {
            setJustJoined(null);
            save(null);
          }}
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mx-auto grid w-full max-w-md gap-2">
      <label htmlFor="launch-email" className="inline-flex items-center justify-center gap-2 text-sm font-semibold">
        <BellRing className="size-4 text-saffron" aria-hidden />
        Get an email when we launch
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id="launch-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "launch-email-error" : "launch-email-note"}
          className="h-11 border-white/20 bg-white/10 text-white placeholder:text-white/50"
        />
        <Button type="submit" size="lg" disabled={sending} className="h-11 bg-metallic-gold text-[oklch(0.2_0.006_70)] hover:opacity-95">
          {sending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <BellRing data-icon="inline-start" />}
          Notify me
        </Button>
      </div>
      {error ? (
        <p id="launch-email-error" className="text-sm text-red-300">
          {error}
        </p>
      ) : (
        <p id="launch-email-note" className="text-xs text-white/55">
          One email at launch. No spam, and we never share your address.
        </p>
      )}
    </form>
  );
}

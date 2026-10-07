"use client";

import { useState, type FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHydrated } from "@/hooks/use-hydrated";
import { useNewsletter } from "@/hooks/use-settings";
import { validateEmail } from "@/lib/validation";

/** Newsletter sign-up, stored in this browser (no email is sent until an email service is connected). */
export function NewsletterForm() {
  const hydrated = useHydrated();
  const { email: subscribedEmail, subscribe, unsubscribe } = useNewsletter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const problem = validateEmail(email);
    setError(problem);
    if (problem) return;
    subscribe(email.trim());
    toast.success("You're subscribed to The Sunday Menu", {
      description: "We'll start sending it once our email service is connected. Unsubscribe here anytime.",
    });
    setEmail("");
  };

  const heading = (
    <>
      <label htmlFor="newsletter-email" className="text-sm font-semibold">
        The Sunday Menu
      </label>
      <p className="text-sm text-muted-foreground">Five recipes worth cooking, every weekend.</p>
    </>
  );

  if (hydrated && subscribedEmail) {
    return (
      <div className="grid gap-2">
        <p className="text-sm font-semibold">The Sunday Menu</p>
        <p className="flex items-start gap-2 text-sm text-muted-foreground" role="status">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-herb" aria-hidden />
          <span>
            Subscribed as <strong className="text-foreground">{subscribedEmail}</strong>.
          </span>
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => {
            unsubscribe();
            toast("Unsubscribed from The Sunday Menu");
          }}
        >
          Unsubscribe
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-2">
      {heading}
      <div className="flex gap-2">
        <Input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "newsletter-error" : undefined}
        />
        <Button type="submit" className="h-10 shrink-0 px-5">
          Subscribe
        </Button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="text-[0.8125rem] text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

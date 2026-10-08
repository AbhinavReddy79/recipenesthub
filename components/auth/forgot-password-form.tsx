"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { FormField } from "@/components/forms/form-field";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth";
import { validateEmail } from "@/lib/validation";
import { AuthSuccess } from "./auth-success";

/** Asks for an email address and sends a password-reset link to it. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const error = validateEmail(email);
    setFieldError(error);
    if (error) return;
    setFormError(null);
    setSubmitting(true);
    const result = await authClient.requestPasswordReset(email).finally(() => setSubmitting(false));
    if (result.ok) setSentTo(email.trim());
    else setFormError(result.error);
  };

  if (sentTo) {
    return (
      <AuthSuccess
        icon={<MailCheck aria-hidden />}
        title="Check your inbox"
        description={`If an account exists for ${sentTo}, we've emailed a link to reset your password. It can take a minute to arrive, so check your spam folder too.`}
        actions={
          <>
            <Button variant="outline" size="lg" onClick={() => setSentTo(null)}>
              Use another email
            </Button>
            <Button asChild size="lg">
              <Link href="/login">Back to log in</Link>
            </Button>
          </>
        }
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <div className="grid justify-items-start gap-4">
        <Logo />
        <div className="grid gap-1.5">
          <h1 className="text-3xl font-semibold sm:text-4xl">Forgot your password?</h1>
          <p className="text-muted-foreground">Enter the email you signed up with and we&apos;ll send you a link to choose a new one.</p>
        </div>
      </div>
      {formError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}
      <FormField id="forgot-email" label="Email" error={fieldError}>
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldError) setFieldError(validateEmail(e.target.value));
            }}
          />
        )}
      </FormField>
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

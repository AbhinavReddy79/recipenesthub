"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CircleCheck, KeyRound } from "lucide-react";
import { FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { authClient } from "@/lib/auth";
import { hasErrors, validatePassword, type FieldErrors } from "@/lib/validation";
import { AuthSuccess } from "./auth-success";

type Field = "password" | "confirm";

/**
 * Landing page for the password-reset email. The link carries a one-time
 * session in the URL fragment, which signs the user in here (older links go
 * through /auth/callback first and arrive already signed in).
 */
export function ResetPasswordForm() {
  const hydrated = useHydrated();
  const { user } = useCurrentUser();
  const [values, setValues] = useState<Record<Field, string>>({ password: "", confirm: "" });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [recovery, setRecovery] = useState<"checking" | "none" | "ok" | "invalid">("checking");

  useEffect(() => {
    let active = true;
    void authClient.completePasswordRecovery().then((result) => {
      if (active) setRecovery(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const validate = (v = values): FieldErrors<Field> => ({
    password: validatePassword(v.password, { strict: true }),
    confirm: !v.confirm ? "Confirm your new password." : v.confirm !== v.password ? "Passwords don't match." : undefined,
  });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (hasErrors(next)) return;
    setFormError(null);
    setSubmitting(true);
    const result = await authClient.updatePassword(values.password).finally(() => setSubmitting(false));
    if (result.ok) setDone(true);
    else setFormError(result.error);
  };

  // Step 1: verify the emailed link (it signs the user in), then load the account.
  if (!hydrated || recovery === "checking" || (recovery === "ok" && !user)) {
    return (
      <div className="grid gap-4" aria-busy>
        <p role="status" className="text-sm font-medium text-muted-foreground">
          Verifying your reset link…
        </p>
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (done) {
    return (
      <AuthSuccess
        title="Password updated"
        description="Your new password is set. Use it next time you log in."
        actions={
          <Button asChild size="lg">
            <Link href="/profile">Go to my profile</Link>
          </Button>
        }
      />
    );
  }

  if (!user || recovery === "invalid") {
    return (
      <AuthSuccess
        icon={<KeyRound aria-hidden />}
        title="This reset link has expired"
        description="Reset links work once and only for a limited time. Go back to log in and choose “Forgot password?” to get a new one."
        actions={
          <Button asChild size="lg">
            <Link href="/login">Back to log in</Link>
          </Button>
        }
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <div className="grid justify-items-start gap-4">
        <Logo />
        <div className="grid gap-1.5">
          <h1 className="text-3xl font-semibold sm:text-4xl">Choose a new password</h1>
          <p className="text-muted-foreground">For {user.email}</p>
        </div>
      </div>
      {recovery === "ok" && (
        <p role="status" className="flex gap-2.5 rounded-xl bg-herb-soft p-3 text-sm font-medium text-herb">
          <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          Your email is verified. Now set a new password for your account.
        </p>
      )}
      {formError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}
      <FormField
        id="reset-password"
        label="New password"
        error={errors.password}
        hint="At least 8 characters, with a letter and a number."
      >
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            value={values.password}
            onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
          />
        )}
      </FormField>
      <FormField id="reset-confirm" label="Confirm new password" error={errors.confirm}>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            value={values.confirm}
            onChange={(e) => setValues((v) => ({ ...v, confirm: e.target.value }))}
          />
        )}
      </FormField>
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : "Update password"}
      </Button>
    </form>
  );
}

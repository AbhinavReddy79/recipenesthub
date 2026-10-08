"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth";
import { hasErrors, validateEmail, validatePassword, type FieldErrors } from "@/lib/validation";

type Field = "email" | "password";

interface LoginFormProps {
  /** Receives the signed-in profile's name. */
  onSuccess: (name: string) => void;
  switchToRegister: React.ReactNode;
  idPrefix?: string;
}

export function LoginForm({ onSuccess, switchToRegister, idPrefix = "login" }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = (v = { email, password }): FieldErrors<Field> => ({
    email: validateEmail(v.email),
    password: validatePassword(v.password),
  });

  // Re-validate as the user types so stale errors clear immediately; otherwise
  // they vanish on blur and shift the layout under the pointer mid-click.
  const onChange = (field: Field, value: string) => {
    const next = { email, password, [field]: value };
    if (field === "email") setEmail(value);
    else setPassword(value);
    if (touched[field]) setErrors(validate(next));
  };

  const onBlur = (field: Field) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate());
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    setTouched({ email: true, password: true });
    if (hasErrors(next)) return;
    setFormError(null);
    setSubmitting(true);
    const result = await authClient.signIn({ email, password, remember }).finally(() => setSubmitting(false));
    if (result.ok) return onSuccess(result.profile.name);
    if (result.field === "email" || result.field === "password") setErrors((e) => ({ ...e, [result.field as Field]: result.error }));
    else setFormError(result.error);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {formError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}

      <FormField id={`${idPrefix}-email`} label="Email" error={touched.email ? errors.email : undefined}>
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => onChange("email", e.target.value)}
            onBlur={() => onBlur("email")}
          />
        )}
      </FormField>

      <FormField
        id={`${idPrefix}-password`}
        label="Password"
        error={touched.password ? errors.password : undefined}
        labelAction={
          <Link
            href="/forgot-password"
            className="text-[0.8125rem] font-medium text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        }
      >
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => onChange("password", e.target.value)}
            onBlur={() => onBlur("password")}
          />
        )}
      </FormField>

      <div className="flex items-center gap-2">
        <Checkbox
          id={`${idPrefix}-remember`}
          checked={remember}
          onCheckedChange={(checked) => setRemember(checked === true)}
        />
        <Label htmlFor={`${idPrefix}-remember`} className="text-sm font-normal text-muted-foreground">
          Remember me on this device
        </Label>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Logging in…" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">New to RecipeNest? {switchToRegister}</p>
    </form>
  );
}

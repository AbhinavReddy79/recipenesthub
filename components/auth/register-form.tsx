"use client";

import { useState, type FormEvent } from "react";
import { AvatarField } from "@/components/forms/avatar-field";
import { FormField } from "@/components/forms/form-field";
import { PasswordInput } from "@/components/forms/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authClient } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  hasErrors,
  passwordStrength,
  validateEmail,
  validatePassword,
  validateRequired,
  type FieldErrors,
} from "@/lib/validation";

type Field = "name" | "username" | "email" | "password" | "confirm" | "bio";

const STRENGTH_LABELS = ["Too weak", "Weak", "Okay", "Strong", "Excellent"];

interface RegisterFormProps {
  onSuccess: (name: string) => void;
  switchToLogin: React.ReactNode;
  idPrefix?: string;
}

export function RegisterForm({ onSuccess, switchToLogin, idPrefix = "register" }: RegisterFormProps) {
  const [values, setValues] = useState<Record<Field, string>>({
    name: "",
    username: "",
    email: "",
    password: "",
    confirm: "",
    bio: "",
  });
  const [avatar, setAvatar] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});

  const validate = (v = values): FieldErrors<Field> => ({
    name: validateRequired(v.name, "Name", 2),
    username:
      validateRequired(v.username, "Username", 3) ??
      (/^[a-z0-9_]{3,24}$/.test(v.username) ? undefined : "Use 3–24 lowercase letters, numbers or underscores."),
    bio: v.bio.length > 160 ? "Keep your bio under 160 characters." : undefined,
    email: validateEmail(v.email),
    password: validatePassword(v.password, { strict: true }),
    confirm: !v.confirm
      ? "Confirm your password."
      : v.confirm !== v.password
        ? "Passwords don't match."
        : undefined,
  });

  const set = (field: Field) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = field === "username" ? event.target.value.toLowerCase().replace(/s+/g, "") : event.target.value;
    const next = { ...values, [field]: value };
    setValues(next);
    if (touched[field]) setErrors(validate(next));
  };

  const blur = (field: Field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors(validate());
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    setTouched({ name: true, username: true, email: true, password: true, confirm: true, bio: true });
    if (hasErrors(next)) return;
    setFormError(null);
    const result = await authClient.signUp({
      name: values.name,
      username: values.username,
      email: values.email,
      password: values.password,
      avatar,
      bio: values.bio,
    });
    if (result.ok) return onSuccess(result.profile.name);
    if (result.field === "email" || result.field === "username") setErrors((e) => ({ ...e, [result.field as Field]: result.error }));
    else setFormError(result.error);
  };

  const strength = passwordStrength(values.password);
  const show = (field: Field) => (touched[field] ? errors[field] : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4">
      {formError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}
      <FormField id={`${idPrefix}-name`} label="Name" error={show("name")}>
        {(control) => (
          <Input
            {...control}
            autoComplete="name"
            placeholder="Your name"
            value={values.name}
            onChange={set("name")}
            onBlur={blur("name")}
          />
        )}
      </FormField>
      <FormField id={`${idPrefix}-username`} label="Username" error={show("username")} hint="Shown as @username on your profile.">
        {(control) => (
          <Input
            {...control}
            autoComplete="username"
            placeholder="yourname"
            value={values.username}
            onChange={set("username")}
            onBlur={blur("username")}
          />
        )}
      </FormField>
      <FormField id={`${idPrefix}-email`} label="Email" error={show("email")}>
        {(control) => (
          <Input
            {...control}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={set("email")}
            onBlur={blur("email")}
          />
        )}
      </FormField>
      <FormField
        id={`${idPrefix}-password`}
        label="Password"
        error={show("password")}
        hint="At least 8 characters, with a letter and a number."
      >
        {(control) => (
          <div className="grid gap-2">
            <PasswordInput
              {...control}
              autoComplete="new-password"
              placeholder="Create a password"
              value={values.password}
              onChange={set("password")}
              onBlur={blur("password")}
            />
            {values.password && (
              <div className="flex items-center gap-2" aria-live="polite">
                <div className="flex flex-1 gap-1" aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full bg-muted transition-colors",
                        i < strength && (strength <= 1 ? "bg-destructive" : strength === 2 ? "bg-saffron" : "bg-herb"),
                      )}
                    />
                  ))}
                </div>
                <span className="w-16 text-right text-xs text-muted-foreground">
                  {STRENGTH_LABELS[strength]}
                </span>
              </div>
            )}
          </div>
        )}
      </FormField>
      <FormField id={`${idPrefix}-confirm`} label="Confirm password" error={show("confirm")}>
        {(control) => (
          <PasswordInput
            {...control}
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={values.confirm}
            onChange={set("confirm")}
            onBlur={blur("confirm")}
          />
        )}
      </FormField>

      <AvatarField id={`${idPrefix}-avatar`} name={values.name} value={avatar} onChange={setAvatar} />
      <FormField id={`${idPrefix}-bio`} label="Bio" error={show("bio")} hint={`Optional · ${values.bio.length}/160`}>
        {(control) => (
          <Textarea
            {...control}
            rows={2}
            maxLength={200}
            placeholder="What do you love to cook?"
            value={values.bio}
            onChange={set("bio")}
            onBlur={blur("bio")}
          />
        )}
      </FormField>

      <Button type="submit" size="lg" className="w-full">
        Create profile
      </Button>
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Your profile is stored securely in this browser (your password is hashed, never saved as text). Accounts
        aren&apos;t synced to a server yet.
      </p>
      <p className="text-center text-sm text-muted-foreground">Already have an account? {switchToLogin}</p>
    </form>
  );
}

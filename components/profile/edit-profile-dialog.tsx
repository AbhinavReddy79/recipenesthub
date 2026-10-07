"use client";

import { useState, type FormEvent } from "react";
import { Check, Pencil } from "lucide-react";
import { toast } from "sonner";
import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AvatarField } from "@/components/forms/avatar-field";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSettings } from "@/hooks/use-settings";
import { CUISINE_LABELS, CUISINE_SLUGS } from "@/lib/labels";
import { DIETS } from "@/lib/recipes/query";
import type { UserPreferences, UserProfile } from "@/types/user";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { hasErrors, validateRequired, type FieldErrors } from "@/lib/validation";

type Field = "name" | "username" | "bio" | "location";

export function EditProfileDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg">
          <Pencil data-icon="inline-start" />
          Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-lg">
        {open && <ProfileForm onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

/** Profile fields form for the signed-in user; also used on the settings page. */
export function ProfileForm(props: { onDone?: () => void; embedded?: boolean }) {
  const { user } = useCurrentUser();
  return user ? <ProfileFormFields profile={user} {...props} /> : null;
}

function ProfileFormFields({ profile, onDone, embedded = false }: { profile: UserProfile; onDone?: () => void; embedded?: boolean }) {
  const { update } = useCurrentUser();
  const { preferences, updatePreferences } = useSettings();
  const [diet, setDiet] = useState<UserPreferences["diet"]>(preferences.diet);
  const [cuisines, setCuisines] = useState<UserPreferences["favoriteCuisines"]>(preferences.favoriteCuisines);
  const [values, setValues] = useState({
    name: profile.name,
    username: profile.username,
    bio: profile.bio,
    location: profile.location,
    avatar: profile.avatar,
  });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const validate = (): FieldErrors<Field> => ({
    name: validateRequired(values.name, "Name", 2),
    username:
      validateRequired(values.username, "Username", 3) ??
      (/^[a-z0-9_]{3,24}$/.test(values.username) ? undefined : "Use 3–24 lowercase letters, numbers or underscores."),
    bio: values.bio.length > 160 ? "Keep your bio under 160 characters." : undefined,
    location: values.location.trim().length > 80 ? "Keep your location under 80 characters." : undefined,
  });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (hasErrors(next)) return;
    setFormError(null);
    setSaving(true);
    const result = await update(profile.id, values).finally(() => setSaving(false));
    if (!result.ok) {
      if (result.field === "username") setErrors((e) => ({ ...e, username: result.error }));
      else setFormError(result.error);
      return;
    }
    // In Settings these fields live in the Preferences section instead.
    if (!embedded) updatePreferences({ diet, favoriteCuisines: cuisines });
    toast.success("Profile updated");
    onDone?.();
  };

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      {!embedded && (
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit profile</DialogTitle>
          <DialogDescription>Your name and photo appear on recipes you publish.</DialogDescription>
        </DialogHeader>
      )}
      {formError && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {formError}
        </p>
      )}
      <AvatarField id="profile-avatar" name={values.name} value={values.avatar} onChange={(avatar) => setValues((v) => ({ ...v, avatar }))} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="profile-name" label="Name" required error={errors.name}>
          {(c) => <Input {...c} value={values.name} onChange={set("name")} autoComplete="name" />}
        </FormField>
        <FormField id="profile-username" label="Username" required error={errors.username}>
          {(c) => (
            <Input
              {...c}
              value={values.username}
              onChange={(e) => setValues((v) => ({ ...v, username: e.target.value.toLowerCase() }))}
              autoComplete="username"
            />
          )}
        </FormField>
      </div>
      <FormField id="profile-bio" label="Bio" error={errors.bio} hint={`${values.bio.length}/160`}>
        {(c) => <Textarea {...c} rows={3} value={values.bio} onChange={set("bio")} />}
      </FormField>
      <FormField id="profile-location" label="Location" hint="Optional" error={errors.location}>
        {(c) => <Input {...c} value={values.location} onChange={set("location")} placeholder="City, Country" />}
      </FormField>
      {!embedded && (
      <>
      <div className="grid gap-1.5 sm:max-w-xs">
        <label htmlFor="profile-diet" className="text-sm font-medium">
          Dietary preference
        </label>
        <Select value={diet} onValueChange={(v) => setDiet(v as UserPreferences["diet"])}>
          <SelectTrigger id="profile-diet" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="None">No preference</SelectItem>
            {DIETS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Favorite cuisines</legend>
        <div className="flex flex-wrap gap-2">
          {CUISINE_SLUGS.map((slug) => {
            const active = cuisines.includes(slug);
            return (
              <button
                key={slug}
                type="button"
                aria-pressed={active}
                onClick={() => setCuisines((prev) => (active ? prev.filter((c) => c !== slug) : [...prev, slug]))}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted",
                )}
              >
                {active && <Check className="size-3.5" aria-hidden />}
                {CUISINE_LABELS[slug]}
              </button>
            );
          })}
        </div>
      </fieldset>
      </>
      )}
      {embedded ? (
        <div>
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? "Saving…" : "Save profile"}
          </Button>
        </div>
      ) : (
        <DialogFooter className="-mx-6 -mb-6 px-6">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      )}
    </form>
  );
}

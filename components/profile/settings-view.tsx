"use client";

import type { ReactNode } from "react";
import {
  Bell,
  Check,
  CircleUser,
  Eraser,
  Globe2,
  Palette,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { THEME_OPTIONS } from "@/components/layout/theme-toggle";
import { ServingsStepper } from "@/components/recipes/detail/servings-stepper";
import { ListSkeleton } from "@/components/shared/skeletons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useHydrated } from "@/hooks/use-hydrated";
import { RequireProfile } from "@/components/auth/require-profile";
import { useCurrentUser } from "@/hooks/use-current-user";
import type { Tone } from "@/components/shared/module-tone";
import { RegionSelect } from "@/components/shared/region-select";
import { useNewsletter, useSettings } from "@/hooks/use-settings";
import { authClient } from "@/lib/auth";
import { clearLocalData } from "@/lib/storage/core";
import { CUISINE_LABELS, CUISINE_SLUGS } from "@/lib/labels";
import { DIETS } from "@/lib/recipes/query";
import { features } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { NotificationSettings, UserPreferences } from "@/types/user";
import { ProfileForm } from "./edit-profile-dialog";

const SECTIONS: Array<{ id: string; label: string; icon: LucideIcon; tone: Tone }> = [
  { id: "profile", label: "Profile", icon: UserRound, tone: "brand" },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal, tone: "herb" },
  { id: "appearance", label: "Appearance", icon: Palette, tone: "berry" },
  { id: "region", label: "Region & prices", icon: Globe2, tone: "amber" },
  { id: "notifications", label: "Notifications", icon: Bell, tone: "ocean" },
  { id: "account", label: "Account", icon: ShieldAlert, tone: "red" },
];
const sectionMeta = (id: string) => SECTIONS.find((s) => s.id === id)!;

const NOTIFICATIONS: Array<{ key: keyof NotificationSettings; label: string; description: string }> = [
  { key: "mealPlanReminders", label: "Meal plan reminders", description: "Show a reminder on the meal planner when days are still unplanned." },
];

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  const { icon: Icon, tone } = sectionMeta(id);
  return (
    <section
      id={id}
      data-tone={tone}
      data-reveal suppressHydrationWarning
      aria-labelledby={`${id}-title`}
      className="relative scroll-mt-24 overflow-hidden rounded-2xl border bg-card p-5 shadow-card sm:p-7"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-tone" />
      <header className="mb-6 flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-tone text-tone-foreground shadow-soft">
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="grid gap-1">
          <h2 id={`${id}-title`} className="text-2xl font-semibold">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

export function SettingsView() {
  const hydrated = useHydrated();
  const { user } = useCurrentUser();
  const { settings, preferences, updatePreferences, updateNotifications } = useSettings();
  const newsletter = useNewsletter();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  if (!hydrated) return <ListSkeleton rows={8} />;

  const setPrefs = (patch: Partial<UserPreferences>, message = "Preferences saved") => {
    updatePreferences(patch);
    toast.success(message);
  };

  const deleteProfile = async () => {
    if (!user) return;
    const result = await authClient.deleteAccount();
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast("Your account and all of its data were permanently deleted.");
    router.push("/");
  };

  const clearBrowser = () => {
    clearLocalData();
    toast("RecipeNest preferences were cleared from this device.");
  };

  const sections = user ? SECTIONS : SECTIONS.filter((s) => s.id === "appearance" || s.id === "region");

  return (
    <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
      <nav aria-label="Settings sections" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 scrollbar-none lg:mx-0 lg:grid lg:px-0">
          {sections.map(({ id, label, icon: Icon, tone }) => (
            <li key={id} data-tone={tone}>
              <a
                href={`#${id}`}
                className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-tone-soft hover:text-tone"
              >
                <span className="flex size-7 items-center justify-center rounded-lg bg-tone-soft text-tone transition-transform group-hover:scale-110">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid min-w-0 gap-6">
        {!user && (
          <RequireProfile
            icon={<CircleUser />}
            title="Personalise RecipeNest"
            description="Create a free profile to edit your details, set dietary preferences and manage reminders. Appearance and region work for everyone."
          >
            {null}
          </RequireProfile>
        )}

        {user && (
        <>
        <Section id="profile" title="Profile" description="Your public name, photo and bio.">
          <ProfileForm embedded />
        </Section>

        <Section id="preferences" title="Preferences" description="Powers “Picked for you” on the homepage, the “My diet” quick filter on Discover, and meal-plan defaults.">
          <div className="grid gap-7">
            <div className="grid gap-2 sm:max-w-xs">
              <Label htmlFor="pref-diet">Dietary preference</Label>
              <Select value={preferences.diet} onValueChange={(v) => setPrefs({ diet: v as UserPreferences["diet"] })}>
                <SelectTrigger id="pref-diet" className="w-full">
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

            <fieldset className="grid gap-3">
              <legend className="mb-3 text-sm font-medium">Favorite cuisines</legend>
              <div className="flex flex-wrap gap-2">
                {CUISINE_SLUGS.map((slug) => {
                  const active = preferences.favoriteCuisines.includes(slug);
                  return (
                    <button
                      key={slug}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        setPrefs({
                          favoriteCuisines: active
                            ? preferences.favoriteCuisines.filter((c) => c !== slug)
                            : [...preferences.favoriteCuisines, slug],
                        })
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
                        active ? "border-tone bg-tone text-tone-foreground shadow-soft" : "bg-background hover:border-tone/40 hover:text-tone",
                      )}
                    >
                      {active && <Check className="size-3.5 animate-pop" aria-hidden />}
                      {CUISINE_LABELS[slug]}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="grid gap-0.5">
                <span className="text-sm font-medium" id="pref-servings-label">
                  Default servings
                </span>
                <span className="text-sm text-muted-foreground">New meal-plan entries start with this many servings.</span>
              </div>
              <ServingsStepper
                label="Default servings"
                value={preferences.defaultServings}
                onChange={(v) => setPrefs({ defaultServings: Math.max(1, Math.min(12, v)) })}
                max={12}
              />
            </div>

          </div>
        </Section>

        </>
        )}

        <Section id="appearance" title="Appearance" description="Choose how RecipeNest looks on this device.">
          <RadioGroup value={theme ?? "light"} onValueChange={setTheme} className="grid gap-3 sm:grid-cols-3" aria-label="Theme">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <Label
                key={value}
                htmlFor={`theme-${value}`}
                className={cn(
                  "flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 font-normal transition-all duration-300",
                  theme === value ? "border-tone bg-tone-soft shadow-card" : "hover:-translate-y-0.5 hover:border-tone/40",
                )}
              >
                <div
                  aria-hidden
                  className={cn(
                    "flex h-20 items-end gap-1.5 overflow-hidden rounded-lg border p-2",
                    value === "light" && "bg-[#fcfaf3]",
                    value === "dark" && "bg-[#141210]",
                    value === "system" && "bg-gradient-to-r from-[#fcfaf3] from-50% to-[#141210] to-50%",
                  )}
                >
                  <span className="h-8 w-1/3 rounded-md bg-[#c0482a]" />
                  <span className="h-12 w-1/3 rounded-md bg-[#006f53]" />
                  <span className="h-5 w-1/3 rounded-md bg-[#e9af41]" />
                </div>
                <span className="flex items-center gap-2 text-sm font-medium">
                  <RadioGroupItem value={value} id={`theme-${value}`} />
                  <Icon className="size-4 text-muted-foreground" aria-hidden />
                  {label}
                </span>
              </Label>
            ))}
          </RadioGroup>
        </Section>

        <Section id="region" title="Region & prices" description="Sets the currency, price estimates and pack sizes for RecipeNest Pantry products on this device.">
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="pref-region">Region</Label>
            <RegionSelect id="pref-region" className="w-full" onChanged={(name) => toast.success(`Prices now shown for ${name}`)} />
            <p className="text-xs text-muted-foreground">Automatic uses your browser&apos;s time zone and language.</p>
          </div>
        </Section>

        {user && (
        <>
        <Section id="notifications" title="Notifications" description="Reminders shown inside RecipeNest. Email isn't connected yet, so nothing is sent to your inbox.">
          <ul className="divide-y">
            {NOTIFICATIONS.map(({ key, label, description }) => (
              <li key={key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <Label htmlFor={`notify-${key}`} className="grid gap-0.5 font-normal">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-sm text-muted-foreground">{description}</span>
                </Label>
                <Switch
                  id={`notify-${key}`}
                  checked={settings.notifications[key]}
                  onCheckedChange={(checked) => {
                    updateNotifications({ [key]: checked });
                    toast.success(`${label} ${checked ? "on" : "off"}`);
                  }}
                />
              </li>
            ))}
            {features.newsletter && (
            <li className="flex items-center justify-between gap-4 py-4 last:pb-0">
              <Label htmlFor="notify-newsletter" className="grid gap-0.5 font-normal">
                <span className="text-sm font-medium">Sunday Menu newsletter</span>
                <span className="text-sm text-muted-foreground">
                  {newsletter.email ? `Subscribed as ${newsletter.email}.` : `Subscribe ${user.email} to weekly recipe picks.`}
                </span>
              </Label>
              <Switch
                id="notify-newsletter"
                checked={Boolean(newsletter.email)}
                onCheckedChange={(checked) => {
                  if (checked) newsletter.subscribe(user.email);
                  else newsletter.unsubscribe();
                  toast.success(checked ? "Subscribed to The Sunday Menu" : "Unsubscribed from The Sunday Menu");
                }}
              />
            </li>
            )}
          </ul>
        </Section>

        <Section id="account" title="Account" description="Your account is stored securely on RecipeNest's servers and syncs across your devices.">
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div className="grid gap-0.5">
                <p className="text-sm font-medium">Delete my account</p>
                <p className="text-sm text-muted-foreground">Permanently removes your account, recipes, reviews, saved recipes, collections, meal plan and shopping list.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="text-destructive hover:text-destructive">
                    <Trash2 />
                    Delete account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes @{user.username}, your sign-in and everything you&apos;ve saved or published, on every device. This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={deleteProfile}>
                      Delete account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
              <div className="grid gap-0.5">
                <p className="text-sm font-medium">Reset this device</p>
                <p className="text-sm text-muted-foreground">Clears region, recipe drafts and other preferences saved in this browser. Your account data isn&apos;t affected.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="text-destructive hover:text-destructive">
                    <Eraser />
                    Reset device
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset this device?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Preferences and unsaved recipe drafts stored in this browser will be cleared. Your account, recipes, collections, meal plan and shopping list stay safe.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={clearBrowser}>
                      Reset device
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Section>
        </>
        )}
      </div>
    </div>
  );
}

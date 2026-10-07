import { useStore } from "@/lib/storage/core";
import { newsletterStorage, newsletterStore, settingsStorage, settingsStore } from "@/lib/storage/settings";

/** The signed-in user's preferences (defaults for visitors). */
export function useSettings() {
  const settings = useStore(settingsStore);
  return { settings, preferences: settings.preferences, ...settingsStorage };
}

export function useNewsletter() {
  const email = useStore(newsletterStore);
  return { email, ...newsletterStorage };
}

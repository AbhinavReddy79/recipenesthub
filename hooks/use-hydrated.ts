import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * `false` during SSR and hydration, `true` afterwards. Use it to show a
 * skeleton instead of flashing default/empty state before saved data loads.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

import { useHydrated } from "@/hooks/use-hydrated";
import { DEFAULT_REGION, detectRegion, formatMoney, getRegion, localizePackSize, regionalPrice } from "@/lib/regions";
import { useStore } from "@/lib/storage/core";
import { regionStorage, regionStore } from "@/lib/storage/region";

/** The pricing region (chosen, or detected from the browser) with helpers to show prices in it. */
export function useRegion() {
  const chosen = useStore(regionStore);
  const hydrated = useHydrated();
  const code = chosen ?? (hydrated ? detectRegion() : DEFAULT_REGION);
  const region = getRegion(code);
  return {
    region,
    isAuto: chosen === null,
    setRegion: regionStorage.setRegion,
    /** A catalog price (USD) in the region's currency. */
    price: (usd: number) => regionalPrice(usd, region),
    format: (value: number) => formatMoney(value, region),
    packSize: (packSize: string) => localizePackSize(packSize, region),
  };
}

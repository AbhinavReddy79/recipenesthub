/**
 * Regions for RecipeNest Pantry pricing. Catalog prices are stored once, in
 * US dollars; each region converts them with a grocery price level (local
 * currency per US dollar of shelf price), so items cost what they typically
 * would in that market rather than a straight exchange-rate conversion.
 * These are rough estimates, not live store prices.
 */
export const REGIONS = [
  { code: "US", name: "United States", currency: "USD", locale: "en-US", priceLevel: 1, metric: false },
  { code: "CA", name: "Canada", currency: "CAD", locale: "en-CA", priceLevel: 1.4, metric: true },
  { code: "GB", name: "United Kingdom", currency: "GBP", locale: "en-GB", priceLevel: 0.72, metric: true },
  { code: "EU", name: "Europe (Eurozone)", currency: "EUR", locale: "en-IE", priceLevel: 0.82, metric: true },
  { code: "IN", name: "India", currency: "INR", locale: "en-IN", priceLevel: 34, metric: true },
  { code: "AU", name: "Australia", currency: "AUD", locale: "en-AU", priceLevel: 1.55, metric: true },
  { code: "AE", name: "United Arab Emirates", currency: "AED", locale: "en-AE", priceLevel: 3.6, metric: true },
  { code: "SG", name: "Singapore", currency: "SGD", locale: "en-SG", priceLevel: 1.45, metric: true },
] as const;

export type Region = (typeof REGIONS)[number];
export type RegionCode = Region["code"];

export const DEFAULT_REGION: RegionCode = "US";

export const isRegionCode = (value: unknown): value is RegionCode => REGIONS.some((r) => r.code === value);

export const getRegion = (code: RegionCode): Region => REGIONS.find((r) => r.code === code) ?? REGIONS[0];

const EUROZONE = new Set([
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES",
]);

const TIME_ZONES: Record<string, RegionCode> = {
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Dubai": "AE",
  "Asia/Singapore": "SG",
  "Europe/London": "GB",
};

function fromCountry(country: string | undefined): RegionCode | null {
  if (!country) return null;
  const upper = country.toUpperCase();
  if (EUROZONE.has(upper)) return "EU";
  return isRegionCode(upper) ? upper : null;
}

/** Best guess at the visitor's region from the browser's time zone and language. Runs in the browser only. */
export function detectRegion(): RegionCode {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (TIME_ZONES[zone]) return TIME_ZONES[zone];
    if (zone.startsWith("Australia/")) return "AU";
    for (const language of navigator.languages ?? [navigator.language]) {
      const region = fromCountry(new Intl.Locale(language).maximize().region);
      if (region) return region;
    }
    if (zone.startsWith("America/")) return "US";
  } catch {
    // Fall through to the default.
  }
  return DEFAULT_REGION;
}

/** A catalog price (USD) as a shelf price in the region: ₹ to the nearest 5, others ending in .49 / .99. */
export function regionalPrice(usd: number, region: Region): number {
  const local = usd * region.priceLevel;
  if (region.currency === "INR") return local < 50 ? Math.max(5, Math.round(local)) : Math.round(local / 5) * 5;
  return Math.max(0.49, Math.round(local * 2) / 2 - 0.01);
}

const formatters = new Map<string, Intl.NumberFormat>();

/** Formats an amount already in the region's currency. */
export function formatMoney(value: number, region: Region): string {
  let formatter = formatters.get(region.code);
  if (!formatter) {
    formatter = new Intl.NumberFormat(region.locale, {
      style: "currency",
      currency: region.currency,
      maximumFractionDigits: region.currency === "INR" ? 0 : 2,
      minimumFractionDigits: region.currency === "INR" ? 0 : 2,
    });
    formatters.set(region.code, formatter);
  }
  return formatter.format(value);
}

/** Rounds a metric amount to a size a shop would sell. */
function niceMetric(value: number, unit: "g" | "ml"): string {
  const big = unit === "g" ? "kg" : "L";
  if (value >= 1000) return `${Number((value / 1000).toFixed(value >= 10000 ? 0 : 1))} ${big}`;
  const step = value < 50 ? 5 : value < 200 ? 10 : value < 500 ? 25 : 50;
  return `${Math.max(step, Math.round(value / step) * step)} ${unit}`;
}

const TO_METRIC: Record<string, [number, "g" | "ml"]> = {
  "fl oz": [29.5735, "ml"],
  oz: [28.3495, "g"],
  lb: [453.592, "g"],
  qt: [946.353, "ml"],
  gal: [3785.41, "ml"],
};

/** Shows a catalog pack size ("5 oz bag", "2 lb") in metric for regions that use it. */
export function localizePackSize(packSize: string, region: Region): string {
  if (!region.metric) return packSize;
  return packSize.replace(/(\d+(?:\.\d+)?)\s?(fl oz|oz|lb|qt|gal)\b/g, (_, amount: string, unit: string) => {
    const [factor, metricUnit] = TO_METRIC[unit];
    return niceMetric(Number(amount) * factor, metricUnit);
  });
}

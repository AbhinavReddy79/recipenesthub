const FRACTIONS: Array<[number, string]> = [
  [1 / 8, "⅛"],
  [1 / 4, "¼"],
  [1 / 3, "⅓"],
  [3 / 8, "⅜"],
  [1 / 2, "½"],
  [5 / 8, "⅝"],
  [2 / 3, "⅔"],
  [3 / 4, "¾"],
  [7 / 8, "⅞"],
];

/** Formats a quantity using kitchen-friendly fractions, e.g. 1.5 → "1½". */
export function formatQuantity(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "";
  if (value >= 10) return String(Math.round(value));

  const whole = Math.floor(value);
  const remainder = value - whole;
  if (remainder < 0.06) return String(whole || 0);
  if (remainder > 0.94) return String(whole + 1);

  let best = FRACTIONS[0];
  for (const candidate of FRACTIONS) {
    if (Math.abs(candidate[0] - remainder) < Math.abs(best[0] - remainder)) best = candidate;
  }
  // Fall back to a decimal when no common fraction is close.
  if (Math.abs(best[0] - remainder) > 0.05) return String(Math.round(value * 10) / 10);
  return whole > 0 ? `${whole}${best[1]}` : best[1];
}

const PLURAL_UNITS: Record<string, string> = {
  cup: "cups",
  clove: "cloves",
  slice: "slices",
  can: "cans",
  rack: "racks",
  shot: "shots",
  portion: "portions",
  bunch: "bunches",
  pinch: "pinches",
};

export function formatUnit(unit: string, quantity: number | null): string {
  if (!unit) return "";
  if (quantity !== null && quantity > 1 && PLURAL_UNITS[unit]) return PLURAL_UNITS[unit];
  return unit;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

/** Compact counts: 24800 → "24.8k". */
export function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(value);
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  // Fixed zone so server and browser agree; India time, as the site is India-first.
  timeZone: "Asia/Kolkata",
});

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return dateFormatter.format(date);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? singular : plural}`;
}

const O_ES = new Set(["tomato", "potato", "mango"]);
const INVARIANT = new Set(["garlic", "rice", "ice", "salt", "fish", "shrimp", "spinach", "cilantro", "parsley", "mint", "basil", "dill", "anise"]);

function pluralWord(word: string): string {
  const lower = word.toLowerCase();
  if (INVARIANT.has(lower) || /s$/.test(lower)) return word;
  if (O_ES.has(lower)) return `${word}es`;
  if (/[^aeiou]y$/.test(lower)) return `${word.slice(0, -1)}ies`;
  if (/(ch|sh|x)$/.test(lower)) return `${word}es`;
  return `${word}s`;
}

/**
 * Counted ingredients read naturally after scaling: "1 tomato" → "2 tomatoes".
 * Only applies when there is no unit (units carry the plural instead).
 */
export function formatIngredientName(name: string, quantity: number | null, unit: string): string {
  if (unit || quantity === null || quantity <= 1) return name;
  const words = name.split(" ");
  words[words.length - 1] = pluralWord(words[words.length - 1]);
  return words.join(" ");
}

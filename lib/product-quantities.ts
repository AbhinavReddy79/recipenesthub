/**
 * How much of a pantry product a recipe needs for a given number of servings,
 * what that share of the pack costs, and how many packs to buy.
 *
 * Recipes measure in kitchen units (cups, tbsp, pieces) while products are sold
 * by weight, volume or count, so cross-unit conversions use typical kitchen
 * estimates (densities, item weights). The UI labels the results "about".
 */
import { formatQuantity, formatUnit } from "@/lib/format";
import { scaleQuantity } from "@/lib/recipes/query";
import type { PantryProduct } from "@/types/product";
import type { Ingredient, IngredientAisle } from "@/types/recipe";

type CountUnit = "piece" | "clove" | "slice" | "portion" | "bunch" | "head" | "bulb" | "loaf" | "rack" | "can" | "pack";

type Measure =
  | { kind: "mass"; grams: number }
  | { kind: "volume"; ml: number }
  | { kind: "count"; of: CountUnit; count: number };

interface Pack {
  measure: Measure;
  /** Sold as cans: an ingredient counted in cans uses one pack per can. */
  cans: number | null;
}

const MASS: Record<string, number> = { g: 1, kg: 1000, oz: 28.35, lb: 453.6 };
const VOLUME: Record<string, number> = {
  ml: 1,
  l: 1000,
  "fl oz": 29.57,
  qt: 946,
  gal: 3785,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  shot: 44,
  pinch: 0.3,
};
const COUNT: Record<string, CountUnit> = {
  "": "piece",
  ct: "piece",
  clove: "clove",
  slice: "slice",
  portion: "portion",
  portions: "portion",
  bunch: "bunch",
  head: "head",
  bulb: "bulb",
  bulbs: "bulb",
  loaf: "loaf",
  rack: "rack",
  can: "can",
  pack: "pack",
};

/** Leafy herbs and greens: light per cup, tiny per leaf. */
const LEAFY = /\b(leaf|leaves|sprigs?|mint|basil|cilantro|coriander|parsley|dill|curry|spinach|kale|arugula|lettuce|methi|herbs?|greens|spring mix|microgreens)\b/i;
/** Tiny whole spices counted one by one. */
const TINY = /\b(pods?|cloves? of|peppercorns?|seeds?|threads?|strands?|stars?|cardamom|saffron)\b/i;

/** Typical grams per millilitre when a cup measure is compared with a weight. */
const DENSITY: Record<IngredientAisle, number> = { Produce: 0.55, Dairy: 1, Meat: 1, Grains: 0.6, Spices: 0.55, Other: 0.95 };
/** Typical weight of one item ("2 onions", "4 chicken thighs") when the product is sold by weight. */
const ITEM_GRAMS: Record<IngredientAisle, number> = { Produce: 150, Dairy: 50, Meat: 150, Grains: 40, Spices: 5, Other: 100 };
/** How much one whole bunch or head holds, for cup measures of chopped herbs or greens. */
const WHOLE_ML: Partial<Record<CountUnit, number>> = { bunch: 480, head: 1900 };
/** Smaller parts of something sold whole. */
const PARTS: Partial<Record<CountUnit, Partial<Record<CountUnit, number>>>> = {
  clove: { bulb: 10, head: 10 },
  slice: { loaf: 20 },
};
/** A "to taste" amount, e.g. salt or garnish. */
const TO_TASTE: Measure = { kind: "volume", ml: 2.5 };

function measure(quantity: number, unit: string): Measure | null {
  const key = unit.trim().toLowerCase();
  if (key in MASS) return { kind: "mass", grams: quantity * MASS[key] };
  if (key in VOLUME) return { kind: "volume", ml: quantity * VOLUME[key] };
  if (key === "in") return { kind: "mass", grams: quantity * 15 }; // an inch of ginger or turmeric
  if (key in COUNT) return { kind: "count", of: COUNT[key], count: quantity };
  return null;
}

/** Parses pack sizes such as "16 oz", "5 lb bag", "1/2 gal", "12 ct", "3 x 0.25 oz" or "14.5 oz can". */
function parsePack(packSize: string): Pack | null {
  const match = packSize.trim().match(/^(\d+(?:\.\d+)?)(?:\/(\d+))?(?:\s*x\s*(\d+(?:\.\d+)?))?\s*(.*)$/i);
  if (!match) return null;
  const amount = (Number(match[1]) / (match[2] ? Number(match[2]) : 1)) * (match[3] ? Number(match[3]) : 1);
  const text = match[4].replace(/\(.*\)/, "").trim().toLowerCase();
  const unit = text.startsWith("fl oz") ? "fl oz" : (text.split(/\s+/)[0] ?? "");
  const result = measure(amount, unit);
  if (!result) return null;
  return { measure: result, cans: /\bcan\b/.test(text) ? 1 : null };
}

function itemGrams(name: string, aisle: IngredientAisle): number {
  if (LEAFY.test(name)) return 0.5;
  if (TINY.test(name)) return 0.5;
  if (/\bchil(i|e|li)e?s?\b/i.test(name)) return 5;
  if (/\b(ladyfingers?|savoiardi|biscuits?|cookies?|crackers?|wafers?)\b/i.test(name)) return 10;
  return ITEM_GRAMS[aisle];
}

/** How many packs one ingredient amount takes, or null when the units can't be compared. */
function packsFor(need: Measure, pack: Pack, ingredient: Ingredient, aisle: IngredientAisle): number | null {
  const have = pack.measure;
  const density = LEAFY.test(ingredient.name) ? 0.2 : DENSITY[aisle];

  if (need.kind === "count" && need.of === "can" && pack.cans) return need.count / pack.cans;
  if (need.kind === "mass" && have.kind === "mass") return need.grams / have.grams;
  if (need.kind === "volume" && have.kind === "volume") return need.ml / have.ml;
  if (need.kind === "volume" && have.kind === "mass") return (need.ml * density) / have.grams;
  if (need.kind === "mass" && have.kind === "volume") return need.grams / density / have.ml;
  if (need.kind === "volume" && have.kind === "count" && WHOLE_ML[have.of]) return need.ml / WHOLE_ML[have.of]! / have.count;

  if (need.kind === "count" && have.kind === "mass") {
    if (need.of === "piece") return (need.count * itemGrams(ingredient.name, aisle)) / have.grams;
    if (need.of === "slice") return (need.count * 25) / have.grams;
    return null;
  }
  if (need.kind === "count" && have.kind === "count") {
    const parts = PARTS[need.of]?.[have.of];
    if (parts) return need.count / parts / have.count;
    if (need.of === "piece" && (have.of === "bunch" || have.of === "head")) {
      // "4 green onions" from a bunch of ~8; "4 lettuce leaves" from a head of ~10.
      const perWhole = have.of === "bunch" ? 8 : LEAFY.test(ingredient.name) ? 10 : 1;
      return need.count / perWhole / have.count;
    }
    if (need.of === have.of || need.of === "piece" || have.of === "piece" || have.of === "pack") return need.count / have.count;
  }
  return null;
}

export interface ProductNeed {
  /** What the recipe calls for at this many servings, e.g. "1½ cups + 2 tbsp". */
  amount: string;
  /** Share of one pack used (1.5 = one and a half packs), or null when it can't be estimated. */
  packShare: number | null;
  /** Whole packs to buy. */
  packs: number;
}

/** What one product is needed for across the recipe ingredients it covers. */
export function productNeed(
  product: PantryProduct,
  ingredients: Ingredient[],
  baseServings: number,
  servings: number,
): ProductNeed {
  const pack = parsePack(product.packSize);
  const parts: string[] = [];
  let share = 0;
  let estimable = pack !== null;

  for (const ingredient of ingredients) {
    const quantity = scaleQuantity(ingredient.quantity, baseServings, servings);
    let need: Measure | null;
    if (quantity === null || quantity <= 0) {
      parts.push("to taste");
      need = TO_TASTE;
    } else {
      const unit = formatUnit(ingredient.unit, quantity);
      parts.push(`${formatQuantity(quantity)}${unit ? ` ${unit}` : ""}`);
      need = measure(quantity, ingredient.unit);
    }
    const used = need && pack ? packsFor(need, pack, ingredient, product.aisle) : null;
    if (used === null) estimable = false;
    else share += used;
  }

  const unique = [...new Set(parts)];
  const amount = unique.length > 1 ? unique.filter((part) => part !== "to taste").join(" + ") : (unique[0] ?? "");
  const packShare = estimable && share > 0 ? share : null;
  // A little rounding slack so 1.02 packs doesn't mean buying two.
  const packs = packShare === null ? 1 : Math.max(1, Math.ceil(packShare - 0.05));
  return { amount, packShare, packs };
}

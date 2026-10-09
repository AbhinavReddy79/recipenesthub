import type { IndianRegion } from "@/types/recipe";

/** North to south, then east, west, the Northeast and the centre. */
export const INDIAN_REGIONS: IndianRegion[] = ["North", "South", "East", "West", "Northeast", "Central"];

export const REGION_BLURBS: Record<IndianRegion, string> = {
  North: "Wheat breads, slow-cooked dals, tandoor smoke and rich, creamy gravies.",
  South: "Rice and lentil batters, coconut, curry leaves and fiery, tangy curries.",
  East: "Mustard oil, river fish, rice and gentle, everyday dals.",
  West: "Sweet-sour Gujarati snacks, Maharashtrian street food and Goan coconut curries.",
  Northeast: "Smoked meats, bamboo shoot, fermented flavours and fresh herbs.",
  Central: "Hearty wheat and rice dishes from the heart of India.",
};

/** Every state and union territory, with the region it's grouped under. */
export const INDIAN_STATES: { name: string; region: IndianRegion }[] = [
  { name: "Jammu & Kashmir", region: "North" },
  { name: "Ladakh", region: "North" },
  { name: "Himachal Pradesh", region: "North" },
  { name: "Punjab", region: "North" },
  { name: "Chandigarh", region: "North" },
  { name: "Haryana", region: "North" },
  { name: "Delhi", region: "North" },
  { name: "Uttarakhand", region: "North" },
  { name: "Uttar Pradesh", region: "North" },
  { name: "Rajasthan", region: "North" },
  { name: "Madhya Pradesh", region: "Central" },
  { name: "Chhattisgarh", region: "Central" },
  { name: "Bihar", region: "East" },
  { name: "Jharkhand", region: "East" },
  { name: "Odisha", region: "East" },
  { name: "West Bengal", region: "East" },
  { name: "Andaman & Nicobar Islands", region: "East" },
  { name: "Assam", region: "Northeast" },
  { name: "Arunachal Pradesh", region: "Northeast" },
  { name: "Manipur", region: "Northeast" },
  { name: "Meghalaya", region: "Northeast" },
  { name: "Mizoram", region: "Northeast" },
  { name: "Nagaland", region: "Northeast" },
  { name: "Sikkim", region: "Northeast" },
  { name: "Tripura", region: "Northeast" },
  { name: "Gujarat", region: "West" },
  { name: "Maharashtra", region: "West" },
  { name: "Goa", region: "West" },
  { name: "Dadra & Nagar Haveli and Daman & Diu", region: "West" },
  { name: "Andhra Pradesh", region: "South" },
  { name: "Telangana", region: "South" },
  { name: "Karnataka", region: "South" },
  { name: "Kerala", region: "South" },
  { name: "Tamil Nadu", region: "South" },
  { name: "Puducherry", region: "South" },
  { name: "Lakshadweep", region: "South" },
];

const regionByState = new Map(INDIAN_STATES.map((s) => [s.name, s.region]));

/** The region a state belongs to; throws for a misspelt state so catalog typos fail the build. */
export function regionOfState(state: string): IndianRegion {
  const region = regionByState.get(state);
  if (!region) throw new Error(`Unknown Indian state or union territory: "${state}"`);
  return region;
}

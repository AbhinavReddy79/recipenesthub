import type { CuisineSlug } from "@/types/recipe";

export interface CuisineRegion {
  /** Shown on tabs and section headings, and stored on recipes as `region`. */
  name: string;
  blurb: string;
}

export interface CuisinePlace {
  /** State, province, city or country a dish comes from (stored on recipes as `state`). */
  name: string;
  region: string;
}

export interface CuisineRegions {
  /** Heading of the explorer panel. */
  title: string;
  intro: string;
  /** What the places are called: "States", "Regions", "Countries"… */
  placeLabel: string;
  regions: CuisineRegion[];
  /** In display order: north to south, then dishes found everywhere, then dishes from abroad. */
  places: CuisinePlace[];
}

const region = (name: string, blurb: string): CuisineRegion => ({ name, blurb });
/** Places that are a region of their own ("Across Italy", "The South"…). */
const self = (name: string): CuisinePlace => ({ name, region: name });

export const CUISINE_REGIONS: Record<CuisineSlug, CuisineRegions> = {
  indian: {
    title: "Explore India, north to south",
    intro: "From Kashmir to Kerala and Gujarat to the Northeast.",
    placeLabel: "States",
    regions: [
      region("North India", "Wheat breads, slow-cooked dals, tandoor smoke and rich, creamy gravies."),
      region("Central India", "Hearty wheat and rice dishes from the heart of India."),
      region("East India", "Mustard oil, river fish, rice and gentle, everyday dals."),
      region("Northeast India", "Smoked meats, bamboo shoot, fermented flavours and fresh herbs."),
      region("West India", "Sweet-sour Gujarati snacks, Maharashtrian street food and Goan coconut curries."),
      region("South India", "Rice and lentil batters, coconut, curry leaves and fiery, tangy curries."),
    ],
    places: [
      ...["Jammu & Kashmir", "Ladakh", "Himachal Pradesh", "Punjab", "Chandigarh", "Haryana", "Delhi", "Uttarakhand", "Uttar Pradesh", "Rajasthan"].map(
        (name) => ({ name, region: "North India" }),
      ),
      ...["Madhya Pradesh", "Chhattisgarh"].map((name) => ({ name, region: "Central India" })),
      ...["Bihar", "Jharkhand", "Odisha", "West Bengal", "Andaman & Nicobar Islands"].map((name) => ({ name, region: "East India" })),
      ...["Assam", "Arunachal Pradesh", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Sikkim", "Tripura"].map((name) => ({
        name,
        region: "Northeast India",
      })),
      ...["Gujarat", "Maharashtra", "Goa", "Dadra & Nagar Haveli and Daman & Diu"].map((name) => ({ name, region: "West India" })),
      ...["Andhra Pradesh", "Telangana", "Karnataka", "Kerala", "Tamil Nadu", "Puducherry", "Lakshadweep"].map((name) => ({
        name,
        region: "South India",
      })),
    ],
  },
  italian: {
    title: "Explore Italy, north to south",
    intro: "From the Alps and the Po valley down to Naples, plus the Italian-American table.",
    placeLabel: "Regions",
    regions: [
      region("North Italy", "Butter, cream, coffee and elegant set desserts from the Alps to the Adriatic."),
      region("Central Italy", "Rome's punchy pastas, rustic bread and peppery olive oil."),
      region("South Italy", "Tomatoes, mozzarella and wood-fired pizza from the sunny south."),
      region("Across Italy", "Home-cooking classics made in kitchens all over the country."),
      region("Italian-American", "Italian food as it grew up in America: generous, garlicky and comforting."),
    ],
    places: [
      { name: "Veneto", region: "North Italy" },
      { name: "Piedmont", region: "North Italy" },
      { name: "Lazio", region: "Central Italy" },
      { name: "Campania", region: "South Italy" },
      self("Across Italy"),
      self("Italian-American"),
    ],
  },
  mexican: {
    title: "Explore Mexico, region by region",
    intro: "Street food from the capital, Jalisco's slow-cooked birria and everyday classics.",
    placeLabel: "States",
    regions: [
      region("Western Mexico", "Jalisco's chili-braised meats and rich consommés."),
      region("Central Mexico", "The taquerias and street stalls of Mexico City."),
      region("Across Mexico", "Salsas, beans and fresh drinks enjoyed all over the country."),
    ],
    places: [{ name: "Jalisco", region: "Western Mexico" }, { name: "Mexico City", region: "Central Mexico" }, self("Across Mexico")],
  },
  chinese: {
    title: "Explore China, north to south",
    intro: "Northern dumplings, Cantonese noodles and congee, and Chinese-American takeout.",
    placeLabel: "Regions",
    regions: [
      region("North China", "Wheat country: dumplings, noodles and steamed buns."),
      region("South China", "Cantonese cooking: wok-fried noodles, delicate congee and dim sum."),
      region("Across China", "Quick home-style dishes cooked everywhere."),
      region("Chinese-American", "Takeout favourites born in Chinese kitchens in America."),
    ],
    places: [{ name: "Beijing", region: "North China" }, { name: "Guangdong", region: "South China" }, self("Across China"), self("Chinese-American")],
  },
  japanese: {
    title: "Explore Japan, region by region",
    intro: "Ramen from Tokyo and Fukuoka, everyday home cooking and sushi as the world loves it.",
    placeLabel: "Regions",
    regions: [
      region("Kanto", "Tokyo's clear, soy-seasoned ramen and city cooking."),
      region("Kyushu", "Fukuoka's rich, creamy pork-bone ramen."),
      region("Across Japan", "Bento staples and home cooking made all over the country."),
      region("Japanese-American", "Sushi rolls in the style of sushi bars abroad."),
    ],
    places: [{ name: "Tokyo", region: "Kanto" }, { name: "Fukuoka", region: "Kyushu" }, self("Across Japan"), self("Japanese-American")],
  },
  korean: {
    title: "Explore Korea, region by region",
    intro: "Seoul street food, Jeonju's famous bibimbap and everyday home cooking.",
    placeLabel: "Regions",
    regions: [
      region("Seoul", "Spicy, chewy street snacks from the capital's food alleys."),
      region("North Jeolla", "Jeonju, Korea's food capital, home of bibimbap."),
      region("Across Korea", "Stews and side dishes on every Korean family table."),
    ],
    places: [self("Seoul"), self("North Jeolla"), self("Across Korea")],
  },
  thai: {
    title: "Explore Thailand, region by region",
    intro: "Bangkok street food, the Malay-influenced south and everyday classics.",
    placeLabel: "Regions",
    regions: [
      region("Central Thailand", "Bangkok's wok-fried noodles and comforting rice soups."),
      region("Southern Thailand", "Grilled skewers and peanut sauces shaped by Malay cooking."),
      region("Across Thailand", "Coconut curries enjoyed all over the country."),
    ],
    places: [{ name: "Bangkok", region: "Central Thailand" }, self("Southern Thailand"), self("Across Thailand")],
  },
  vietnamese: {
    title: "Explore Vietnam, north to south",
    intro: "Hanoi's soups and grilled pork, and Saigon's sandwiches and fresh rolls.",
    placeLabel: "Cities",
    regions: [
      region("North Vietnam", "Hanoi's clear broths, herbs and charcoal-grilled pork."),
      region("South Vietnam", "Saigon's fresh, bright and herb-packed street food."),
    ],
    places: [
      { name: "Hanoi", region: "North Vietnam" },
      { name: "Ho Chi Minh City", region: "South Vietnam" },
    ],
  },
  mediterranean: {
    title: "Explore the Mediterranean, country by country",
    intro: "From Spain and Greece to Lebanon, Turkey and North Africa.",
    placeLabel: "Countries",
    regions: [
      region("Southern Europe", "Grilled skewers, saffron rice and plenty of olive oil and lemon."),
      region("Eastern Mediterranean", "Mezze, spiced kofta and creamy dips."),
      region("North Africa", "Spiced tomato and pepper dishes, cooked in one pan."),
      region("Modern Mediterranean", "Light, everyday dishes in the Mediterranean style."),
    ],
    places: [
      { name: "Spain", region: "Southern Europe" },
      { name: "Greece", region: "Southern Europe" },
      { name: "Turkey", region: "Eastern Mediterranean" },
      { name: "Lebanon", region: "Eastern Mediterranean" },
      { name: "Tunisia", region: "North Africa" },
      self("Modern Mediterranean"),
    ],
  },
  american: {
    title: "Explore America, region by region",
    intro: "Northeastern brunch classics, Chicago's brownies, Southern comfort food and diner favourites.",
    placeLabel: "Regions",
    regions: [
      region("Northeast", "Brunch and bakery classics from New York and New England."),
      region("Midwest", "Hearty, home-baked comfort from the heartland."),
      region("The South", "Barbecue, fried chicken and party plates from the Southern table."),
      region("Across the USA", "Diner, café and home-kitchen favourites found coast to coast."),
    ],
    places: [
      { name: "New York", region: "Northeast" },
      { name: "Massachusetts", region: "Northeast" },
      { name: "Illinois", region: "Midwest" },
      self("The South"),
      self("Across the USA"),
    ],
  },
};

/** The region a dish's place belongs to; throws for a misspelt place so catalog typos fail the build. */
export function regionOf(cuisine: CuisineSlug, place: string): string {
  const found = CUISINE_REGIONS[cuisine].places.find((p) => p.name === place);
  if (!found) throw new Error(`Unknown place "${place}" for ${cuisine} cuisine`);
  return found.region;
}

/** URL-friendly name of a place, used in ?place= on its cuisine page, e.g. "tamil-nadu". */
export function placeSlug(name: string): string {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

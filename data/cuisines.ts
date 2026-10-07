import { unsplash } from "@/lib/images";
import type { Cuisine } from "@/types/recipe";

export const cuisines: Cuisine[] = [
  {
    slug: "indian",
    name: "Indian",
    region: "South Asia",
    description:
      "Layered spices, slow-cooked curries, fragrant biryanis and breads straight from the tandoor.",
    image: unsplash("1585937421612-70a008356fbe", 1000),
  },
  {
    slug: "italian",
    name: "Italian",
    region: "Europe",
    description: "Simple, ingredient-first cooking — fresh pasta, blistered pizza and silky desserts.",
    image: unsplash("1621996346565-e3dbc646d9a9", 1000),
  },
  {
    slug: "mexican",
    name: "Mexican",
    region: "Latin America",
    description: "Bright salsas, smoky chilies and tacos for every night of the week.",
    image: unsplash("1565299585323-38d6b0865b47", 1000),
  },
  {
    slug: "chinese",
    name: "Chinese",
    region: "East Asia",
    description: "Wok-charred noodles, crispy favourites and dumplings worth folding by hand.",
    image: unsplash("1585032226651-759b368d7246", 1000),
  },
  {
    slug: "japanese",
    name: "Japanese",
    region: "East Asia",
    description: "Comforting ramen, delicate sushi and the art of balance.",
    image: unsplash("1569718212165-3a8278d5f624", 1000),
  },
  {
    slug: "mediterranean",
    name: "Mediterranean",
    region: "Southern Europe & Levant",
    description: "Olive oil, lemon, herbs and grilled everything. Made for long, shared meals.",
    image: unsplash("1476224203421-9ac39bcb3327", 1000),
  },
  {
    slug: "american",
    name: "American",
    region: "North America",
    description: "Diner classics, backyard barbecue and bakery favourites.",
    image: unsplash("1568901346375-23c9450c58cd", 1000),
  },
  {
    slug: "korean",
    name: "Korean",
    region: "East Asia",
    description: "Bold gochujang heat, sesame and beautifully composed rice bowls.",
    image: unsplash("1590301157890-4810ed352733", 1000),
  },
  {
    slug: "thai",
    name: "Thai",
    region: "Southeast Asia",
    description: "Sweet, sour, salty and spicy in perfect harmony.",
    image: unsplash("1559847844-5315695dadae", 1000),
  },
  {
    slug: "vietnamese",
    name: "Vietnamese",
    region: "Southeast Asia",
    description: "Aromatic broths, fresh herbs and vibrant, clean flavours.",
    image: unsplash("1582878826629-29b7ad1cdc43", 1000),
  },
];

/** Cuisines featured on the homepage. */
export const featuredCuisineSlugs = [
  "indian",
  "italian",
  "mexican",
  "chinese",
  "japanese",
  "mediterranean",
  "american",
] as const;

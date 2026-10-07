import { unsplash } from "@/lib/images";
import type { Category } from "@/types/recipe";

export const categories: Category[] = [
  {
    slug: "breakfast",
    name: "Breakfast",
    description: "Slow weekend brunches and speedy weekday starts.",
    image: unsplash("1528207776546-365bb710ee93", 800),
  },
  {
    slug: "lunch",
    name: "Lunch",
    description: "Bowls, salads and midday favourites.",
    image: unsplash("1512621776951-a57141f2eefd", 800),
  },
  {
    slug: "dinner",
    name: "Dinner",
    description: "Weeknight wins and showstopping mains.",
    image: unsplash("1603894584373-5ac82b2ae398", 800),
  },
  {
    slug: "desserts",
    name: "Desserts",
    description: "Cakes, cookies and everything sweet.",
    image: unsplash("1578985545062-69928b1d9587", 800),
  },
  {
    slug: "snacks",
    name: "Snacks",
    description: "Little bites for in-between moments.",
    image: unsplash("1601050690597-df0568f70950", 800),
  },
  {
    slug: "drinks",
    name: "Drinks",
    description: "Smoothies, lemonades and coffee-shop classics.",
    image: unsplash("1497534446932-c925b458314e", 800),
  },
  {
    slug: "healthy",
    name: "Healthy",
    description: "Nourishing, colourful and full of flavour.",
    image: unsplash("1540189549336-e6e99c3679fe", 800),
  },
  {
    slug: "quick-meals",
    name: "Quick Meals",
    description: "On the table in 30 minutes or less.",
    image: unsplash("1603133872878-684f208fb84b", 800),
  },
];

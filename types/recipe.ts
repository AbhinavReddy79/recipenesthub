export type Difficulty = "Easy" | "Medium" | "Hard";

export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Dessert" | "Drink";

export type Diet =
  | "Vegetarian"
  | "Vegan"
  | "Gluten-Free"
  | "Dairy-Free"
  | "High-Protein"
  | "Low-Carb";

export type CategorySlug =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "desserts"
  | "snacks"
  | "drinks"
  | "healthy"
  | "quick-meals";

export type CuisineSlug =
  | "indian"
  | "italian"
  | "mexican"
  | "chinese"
  | "japanese"
  | "mediterranean"
  | "american"
  | "korean"
  | "thai"
  | "vietnamese";

/** Aisle used to group items on the shopping list. */
export type IngredientAisle = "Produce" | "Dairy" | "Meat" | "Grains" | "Spices" | "Other";

export interface Ingredient {
  id: string;
  /** Quantity for the recipe's base servings. `null` for "to taste" style items. */
  quantity: number | null;
  unit: string;
  name: string;
  note?: string;
  aisle: IngredientAisle;
}

export interface InstructionStep {
  id: string;
  text: string;
  /** Optional timer hint in minutes, surfaced in cooking mode. */
  timerMinutes?: number;
}

export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
}

export interface AuthorSummary {
  id: string;
  name: string;
  username: string;
  avatar: string;
}

export type RecipeStatus = "published" | "draft" | "pending" | "rejected";

/** Credit for an openly licensed photo (shown under the photo on the recipe page). */
export interface ImageCredit {
  author: string;
  /** Short licence name, e.g. "CC BY-SA 4.0". */
  license: string;
  /** Page for the original file, e.g. on Wikimedia Commons. */
  source: string;
}

/** Regions used to explore Indian food from north to south. */
export type IndianRegion = "North" | "South" | "East" | "West" | "Northeast" | "Central";

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  imageCredit?: ImageCredit;
  cuisine: CuisineSlug;
  /** Indian recipes: the state or union territory the dish comes from. */
  state?: string;
  /** Indian recipes: the part of India that state belongs to. */
  region?: IndianRegion;
  categories: CategorySlug[];
  mealType: MealType;
  difficulty: Difficulty;
  diets: Diet[];
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  ingredients: Ingredient[];
  steps: InstructionStep[];
  nutrition: Nutrition;
  /**
   * Editorial ordering set by the RecipeNest kitchen for "Featured" lists.
   * Not user activity: user-created recipes use 0.
   */
  editorScore: number;
  authorId: string;
  /** Denormalized author info, as an API response would include. */
  author: AuthorSummary;
  createdAt: string;
  status: RecipeStatus;
  tags?: string[];
}

export type RecipeSort = "featured" | "newest" | "quickest";

export interface RecipeFilters {
  query: string;
  cuisines: CuisineSlug[];
  diets: Diet[];
  mealTypes: MealType[];
  difficulties: Difficulty[];
  /** Maximum total time in minutes; `null` means any. */
  maxMinutes: number | null;
  category: CategorySlug | null;
}

export interface Category {
  slug: CategorySlug;
  name: string;
  description: string;
  image: string;
}

export interface Cuisine {
  slug: CuisineSlug;
  name: string;
  description: string;
  image: string;
  region: string;
}

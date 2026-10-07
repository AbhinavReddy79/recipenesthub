/**
 * Where to order groceries in each region. RecipeNest has no partnership
 * with these services: each link opens the platform's own search for the
 * item, and prices, availability and checkout happen there.
 */
import type { RegionCode } from "@/lib/regions";

export interface OrderPlatform {
  name: string;
  /** "Quick delivery" apps vs. scheduled online supermarkets. */
  kind: "Quick delivery" | "Online grocery" | "Marketplace";
  searchUrl: (query: string) => string;
}

const q = encodeURIComponent;

const PLATFORMS: Record<RegionCode, OrderPlatform[]> = {
  IN: [
    { name: "Blinkit", kind: "Quick delivery", searchUrl: (s) => `https://blinkit.com/s/?q=${q(s)}` },
    { name: "Swiggy Instamart", kind: "Quick delivery", searchUrl: (s) => `https://www.swiggy.com/instamart/search?custom_back=true&query=${q(s)}` },
    { name: "Zepto", kind: "Quick delivery", searchUrl: (s) => `https://www.zeptonow.com/search?query=${q(s)}` },
    { name: "BigBasket", kind: "Online grocery", searchUrl: (s) => `https://www.bigbasket.com/ps/?q=${q(s)}` },
    { name: "Amazon India", kind: "Marketplace", searchUrl: (s) => `https://www.amazon.in/s?k=${q(s)}` },
  ],
  US: [
    { name: "Instacart", kind: "Quick delivery", searchUrl: (s) => `https://www.instacart.com/store/s?k=${q(s)}` },
    { name: "Walmart", kind: "Online grocery", searchUrl: (s) => `https://www.walmart.com/search?q=${q(s)}` },
    { name: "Amazon", kind: "Marketplace", searchUrl: (s) => `https://www.amazon.com/s?k=${q(s)}` },
  ],
  CA: [
    { name: "Walmart Canada", kind: "Online grocery", searchUrl: (s) => `https://www.walmart.ca/search?q=${q(s)}` },
    { name: "Amazon Canada", kind: "Marketplace", searchUrl: (s) => `https://www.amazon.ca/s?k=${q(s)}` },
  ],
  GB: [
    { name: "Tesco", kind: "Online grocery", searchUrl: (s) => `https://www.tesco.com/groceries/en-GB/search?query=${q(s)}` },
    { name: "Sainsbury's", kind: "Online grocery", searchUrl: (s) => `https://www.sainsburys.co.uk/gol-ui/SearchResults/${q(s)}` },
    { name: "Amazon UK", kind: "Marketplace", searchUrl: (s) => `https://www.amazon.co.uk/s?k=${q(s)}` },
  ],
  EU: [
    { name: "Amazon Germany", kind: "Marketplace", searchUrl: (s) => `https://www.amazon.de/s?k=${q(s)}` },
    { name: "Amazon France", kind: "Marketplace", searchUrl: (s) => `https://www.amazon.fr/s?k=${q(s)}` },
  ],
  AU: [
    { name: "Woolworths", kind: "Online grocery", searchUrl: (s) => `https://www.woolworths.com.au/shop/search/products?searchTerm=${q(s)}` },
    { name: "Coles", kind: "Online grocery", searchUrl: (s) => `https://www.coles.com.au/search/products?q=${q(s)}` },
  ],
  AE: [
    { name: "Noon", kind: "Quick delivery", searchUrl: (s) => `https://www.noon.com/uae-en/search/?q=${q(s)}` },
    { name: "Carrefour UAE", kind: "Online grocery", searchUrl: (s) => `https://www.carrefouruae.com/mafuae/en/search?keyword=${q(s)}` },
    { name: "Amazon UAE", kind: "Marketplace", searchUrl: (s) => `https://www.amazon.ae/s?k=${q(s)}` },
  ],
  SG: [
    { name: "FairPrice", kind: "Online grocery", searchUrl: (s) => `https://www.fairprice.com.sg/search?query=${q(s)}` },
    { name: "Amazon Singapore", kind: "Marketplace", searchUrl: (s) => `https://www.amazon.sg/s?k=${q(s)}` },
  ],
};

export const platformsFor = (region: RegionCode): OrderPlatform[] => PLATFORMS[region];

/** A clean search phrase: "Sweet corn kernels (frozen)" → "Sweet corn kernels frozen". */
export const orderQuery = (name: string) => name.replace(/[()]/g, "").replace(/\s+/g, " ").trim();

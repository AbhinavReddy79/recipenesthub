# RecipeNest

A frontend-only recipe discovery and meal-planning platform built with Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui (Radix) and Lucide icons.

There is **no backend yet**. The official recipe catalog (53 recipes, credited to **RecipeNest Kitchen**) ships with the app. Everything else starts at zero: there are no demo users, seeded saves, collections, meal plans, community content, reviews or invented statistics. Visitors create real profiles (stored in this browser, passwords salted + hashed), and each profile’s personal data is kept in its own namespace in `localStorage`. Published user recipes form the Community.

## Getting started

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

Optional: set `NEXT_PUBLIC_SITE_URL` to your deployed origin so canonical URLs, Open Graph tags and the sitemap are absolute.

## Project structure

```
app/                 Routes (App Router). Pages fetch data on the server via lib/services.
components/
  ui/                shadcn/ui primitives (owned code, lightly tuned)
  layout/            Navbar, MobileNav, Footer, search palette, theme toggle
  home/              Homepage sections
  recipes/           RecipeCard, grids, filters, search, detail page, cooking mode, share/print
  collections/ planner/ shopping/ community/ profile/ admin/ auth/ forms/ shared/
data/                Official catalog (recipes split by cuisine, categories, cuisines) + an example week for the homepage preview
types/               Domain types (recipe, user, collection, mealPlan)
lib/
  services/          Data access layer (async) — the swap point for a real API/database
  recipes/           Pure logic: search, filters, sorting, ingredient matching, serving scaling, draft model
  storage/           localStorage layer: core (device vs per-user scopes, session) + accounts, favorites,
                     collections, recipes, mealPlanner, shoppingList, settings (sanitises corrupted data)
  auth.ts            Frontend-only auth client — the swap point for real authentication
hooks/               Domain hooks: useFavorites, useCollections, useMealPlan, useShoppingList, ...
```

## Connecting a backend later

| Today (frontend only)             | Replace with                                   | Touch only                       |
| --------------------------------- | ---------------------------------------------- | -------------------------------- |
| `data/*` mock catalog             | Database / CMS queries                         | `lib/services/*`                 |
| `localStorage` favorites, plans…  | User-scoped API calls                          | `lib/storage/*` (hooks keep their API) |
| Local accounts & session          | Auth provider                                  | `lib/auth.ts`, `lib/storage/accounts.ts`, `hooks/use-current-user.ts` |

Components never touch `localStorage` or mock data directly: server pages call `lib/services`, client components use `hooks/use-*`, and the hooks call `lib/storage`. Deleting a recipe cascades to favorites, collections and the meal plan.

## Notable features

- URL-synced filters on Discover (shareable, refresh-safe) using the History API
- Full-text search across title, ingredients, cuisine, category and diet tags
- “Cook with what you have” ingredient matching with match percentages
- Serving scaling with kitchen-friendly fractions, distraction-free cooking mode with step timers and screen wake lock
- Multi-step recipe creation with validation, autosave, preview, publish/draft and edit
- Weekly meal planner (drag-and-drop on desktop, stacked on mobile) → aggregated shopping list by aisle
- Light / dark / system themes, skeletons, empty and error states, JSON-LD recipe data, sitemap and robots

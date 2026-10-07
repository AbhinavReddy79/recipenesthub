# RecipeNest

A recipe discovery and meal-planning platform built with Next.js 16 (App Router), React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui (Radix) and Lucide icons, with **Supabase** (Postgres, Auth, Storage) as the backend.

The official recipe catalog (credited to **RecipeNest Kitchen**) ships with the app as static data. Everything personal lives in Supabase and starts at zero: there are no demo users, seeded saves, collections, meal plans, community content, reviews or invented statistics. Published user recipes form the Community.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL + publishable key
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

Without the Supabase variables the catalog still works; sign-in and personal features show a friendly "not available" message.

## Supabase setup

1. **Create a project** at [supabase.com](https://supabase.com). From **Project Settings → API** copy the project URL and the **publishable** key (or the legacy **anon** key) into `.env.local`. Never use the `service_role`/secret key in this app: it bypasses Row Level Security and the app doesn't need it.
2. **Create the schema**: open **SQL Editor**, paste the whole of [`supabase/migrations/20261007000000_init.sql`](supabase/migrations/20261007000000_init.sql) and run it. (With the Supabase CLI: `supabase link` then `supabase db push`.) It creates tables, RLS policies, triggers, RPCs and the `avatars` / `recipe-images` storage buckets.
3. **Configure Auth** (**Authentication → URL Configuration**):
   - Site URL: your production origin, e.g. `https://recipe-nest-tan.vercel.app`
   - Redirect URLs: `http://localhost:3000/auth/callback` and `https://recipe-nest-tan.vercel.app/auth/callback`
   - Keep **Confirm email** enabled (**Authentication → Sign In / Providers → Email**). For real traffic, set up custom SMTP: the built-in email sender is heavily rate-limited.
   - **Branded emails**: set up custom SMTP (**Authentication → Emails → SMTP Settings**, sender name `RecipeNest`), then paste the templates from [`supabase/templates/`](supabase/templates) into **Confirm sign up**, **Reset password** and **Change email address**. Their `token_hash` links work in any browser (the default links only sign in from the browser that started the flow).
4. **Make yourself an admin** after signing up once:
   ```sql
   update public.profiles set role = 'admin' where username = 'your_username';
   ```
   The admin console (`/admin`) appears in your account menu. Admin rights are enforced in the database, not just the UI.
5. **Deploy**: add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Vercel project (**Settings → Environment Variables**) and redeploy.

### Data model

| Table | Holds | Access (RLS) |
| --- | --- | --- |
| `profiles` | name, username, avatar, bio, location, role, status (1:1 with `auth.users`, created by trigger on sign-up) | public read; owner updates (role/status admin-only) |
| `user_settings` | diet, favourite cuisines, default servings, reminders | owner only |
| `recipes` + `recipe_ingredients` + `recipe_steps` | user-created recipes | published: public; drafts: author (+ admins) |
| `favorites`, `collections`, `collection_recipes` | saved recipes and collections | owner only |
| `meal_plan_entries` | weekly planner slots | owner only |
| `shopping_list_items` | list items; `product_id` + `product` snapshot for future grocery/product integrations | owner only |
| `reviews`, `cooked_log` | ratings and cooking history | reviews public read / author write; cooked log owner only |
| storage `avatars`, `recipe-images` | uploaded photos under `<user id>/` | public read; owner writes |

Personal tables reference catalog recipes by **slug**, so the static catalog and user-created recipes are saved the same way. Deleting a user recipe removes its saves, collection entries, plan slots and reviews via a trigger; deleting an account (Settings → Account) cascades everything.

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
  services/          Static catalog access (async) for server pages
  recipes/           Pure logic: search, filters, sorting, ingredient matching, serving scaling, draft model
  supabase/          Browser + server clients, env handling, Database types
  storage/           Client stores: Supabase-backed (accounts, favorites, collections, recipes, mealPlanner,
                     shoppingList, settings, reviews) + device-only (region, newsletter, form autosave); sync.ts loads them on sign-in
  auth.ts            Supabase Auth: sign-in, sign-up with email confirmation, password reset, account deletion
supabase/migrations/ SQL schema, RLS policies, triggers, RPCs and storage buckets
proxy.ts             Refreshes the Supabase session cookie on each request
hooks/               Domain hooks: useFavorites, useCollections, useMealPlan, useShoppingList, ...
```

## How data flows

Components never touch Supabase or `localStorage` directly: server pages read the static catalog via `lib/services`, client components use `hooks/use-*`, and the hooks read from stores in `lib/storage`. After sign-in, `lib/storage/sync.ts` loads the user's data from Supabase into those stores; writes update the UI optimistically and roll back with a toast if the database rejects them. `proxy.ts` refreshes the auth session cookie on each request.

## Notable features

- URL-synced filters on Discover (shareable, refresh-safe) using the History API
- Full-text search across title, ingredients, cuisine, category and diet tags
- “Cook with what you have” ingredient matching with match percentages
- Serving scaling with kitchen-friendly fractions, distraction-free cooking mode with step timers and screen wake lock
- Multi-step recipe creation with validation, autosave, preview, publish/draft and edit
- Weekly meal planner (drag-and-drop on desktop, stacked on mobile) → aggregated shopping list by aisle
- Light / dark / system themes, skeletons, empty and error states, JSON-LD recipe data, sitemap and robots

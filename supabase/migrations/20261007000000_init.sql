-- RecipeNest: initial schema, row level security, triggers and storage.
--
-- Run once in the Supabase SQL Editor (or with `supabase db push`).
-- The official recipe catalog stays in the app's code; personal data refers
-- to any recipe (official or community) by its slug.
--
-- Security model: every table has RLS enabled. Personal data is readable and
-- writable only by its owner. Published recipes, reviews and public profile
-- fields are readable by everyone. Suspended accounts cannot write.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user, created automatically on sign-up)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  name text not null check (char_length(name) between 1 and 80),
  avatar_url text not null default '',
  bio text not null default '' check (char_length(bio) <= 160),
  location text not null default '' check (char_length(location) <= 80),
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Public profile for each account. Emails stay private in auth.users.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Security-definer helpers used by policies (they read profiles without
-- re-triggering profile policies).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and status = 'active'
  );
$$;

-- Users can edit their own profile but never their own role or status.
-- (Changes made outside a user session, e.g. in the SQL Editor, are allowed.)
create or replace function public.guard_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id or new.created_at is distinct from old.created_at then
    raise exception 'Profile id and creation date cannot be changed';
  end if;
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and (select auth.uid()) is not null
     and not public.is_admin() then
    raise exception 'Only admins can change role or status' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_columns
  before update on public.profiles
  for each row execute function public.guard_profile_columns();

-- ---------------------------------------------------------------------------
-- Settings
-- ---------------------------------------------------------------------------

create table public.user_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  diet text not null default 'None',
  favorite_cuisines text[] not null default '{}',
  default_servings integer not null default 2 check (default_servings between 1 and 12),
  meal_plan_reminders boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- Create the profile and settings rows when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username, name, bio)
  values (
    new.id,
    lower(coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), 'cook_' || substr(replace(new.id::text, '-', ''), 1, 12))),
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1)), 80),
    left(coalesce(trim(new.raw_user_meta_data ->> 'bio'), ''), 160)
  );
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- User-created recipes (the official catalog lives in the app's code)
-- ---------------------------------------------------------------------------

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 600),
  image_url text not null default '',
  cuisine text not null,
  categories text[] not null default '{}',
  meal_type text not null,
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  diets text[] not null default '{}',
  prep_minutes integer not null default 0 check (prep_minutes between 0 and 2880),
  cook_minutes integer not null default 0 check (cook_minutes between 0 and 2880),
  servings integer not null default 1 check (servings between 1 and 100),
  nutrition jsonb not null default '{}'::jsonb,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'pending', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_author_id_idx on public.recipes (author_id);
create index recipes_status_idx on public.recipes (status);

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  position integer not null,
  quantity numeric check (quantity is null or quantity >= 0),
  unit text not null default '',
  name text not null check (char_length(name) between 1 and 120),
  note text,
  aisle text not null check (aisle in ('Produce', 'Dairy', 'Meat', 'Grains', 'Spices', 'Other')),
  unique (recipe_id, position)
);

create table public.recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  position integer not null,
  text text not null check (char_length(text) between 1 and 2000),
  timer_minutes integer check (timer_minutes is null or timer_minutes between 1 and 1440),
  unique (recipe_id, position)
);

-- ---------------------------------------------------------------------------
-- Personal data
-- ---------------------------------------------------------------------------

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  recipe_slug text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_slug)
);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 200),
  cover_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index collections_user_id_idx on public.collections (user_id);

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

create table public.collection_recipes (
  collection_id uuid not null references public.collections (id) on delete cascade,
  recipe_slug text not null,
  added_at timestamptz not null default now(),
  primary key (collection_id, recipe_slug)
);

create table public.meal_plan_entries (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day text not null check (day in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  slot text not null check (slot in ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
  recipe_slug text not null,
  servings integer not null check (servings between 1 and 24),
  updated_at timestamptz not null default now(),
  primary key (user_id, day, slot)
);

-- product_id + product snapshot keep the list ready for grocery integrations:
-- a future products table or store API can be joined on product_id.
create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  quantity numeric check (quantity is null or quantity >= 0),
  unit text not null default '',
  aisle text not null check (aisle in ('Produce', 'Dairy', 'Meat', 'Grains', 'Spices', 'Other')),
  checked boolean not null default false,
  sources text[] not null default '{}',
  product_id text,
  product jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shopping_list_items_user_id_idx on public.shopping_list_items (user_id);

create trigger shopping_list_items_set_updated_at
  before update on public.shopping_list_items
  for each row execute function public.set_updated_at();

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  recipe_slug text not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  text text not null default '' check (char_length(text) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (recipe_slug, author_id)
);

create index reviews_recipe_slug_idx on public.reviews (recipe_slug);

create table public.cooked_log (
  user_id uuid not null references public.profiles (id) on delete cascade,
  recipe_slug text not null,
  cooked_at timestamptz not null default now(),
  primary key (user_id, recipe_slug)
);

-- Average rating per recipe (public, computed from real reviews only).
create view public.recipe_ratings
with (security_invoker = true)
as
  select recipe_slug, count(*)::integer as review_count, round(avg(rating)::numeric, 2)::double precision as average_rating
  from public.reviews
  group by recipe_slug;

-- When a community recipe is deleted, remove it from everyone's saved items,
-- collections, plans, reviews and cooking history.
create or replace function public.purge_recipe_references()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.favorites where recipe_slug = old.slug;
  delete from public.collection_recipes where recipe_slug = old.slug;
  delete from public.meal_plan_entries where recipe_slug = old.slug;
  delete from public.reviews where recipe_slug = old.slug;
  delete from public.cooked_log where recipe_slug = old.slug;
  return old;
end;
$$;

create trigger recipes_purge_references
  after delete on public.recipes
  for each row execute function public.purge_recipe_references();

-- ---------------------------------------------------------------------------
-- Account management (no service-role key needed in the app)
-- ---------------------------------------------------------------------------

-- Deletes the signed-in user's account; profile and all personal rows cascade.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;

-- Admin console: list accounts with their (private) email addresses.
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  username text,
  name text,
  avatar_url text,
  bio text,
  location text,
  role text,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.username, p.name, p.avatar_url, p.bio, p.location, p.role, p.status, p.created_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

-- Admin console: delete another account.
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if target = (select auth.uid()) then
    raise exception 'Use account settings to delete your own account';
  end if;
  delete from auth.users where id = target;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
revoke all on function public.admin_list_users() from public, anon;
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.favorites enable row level security;
alter table public.collections enable row level security;
alter table public.collection_recipes enable row level security;
alter table public.meal_plan_entries enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.reviews enable row level security;
alter table public.cooked_log enable row level security;

-- Profiles: public fields are readable by everyone; owners (and admins) edit.
create policy "Profiles are viewable by everyone"
  on public.profiles for select to anon, authenticated using (true);
create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Admins update any profile"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Settings: owner only.
create policy "Users read their own settings"
  on public.user_settings for select to authenticated using (user_id = (select auth.uid()));
create policy "Users create their own settings"
  on public.user_settings for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_active_user());
create policy "Users update their own settings"
  on public.user_settings for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and public.is_active_user());

-- Recipes: published ones are public; drafts only for their author (and admins).
create policy "Published recipes are public; authors see their own"
  on public.recipes for select to anon, authenticated
  using (status = 'published' or author_id = (select auth.uid()) or public.is_admin());
create policy "Users create their own recipes"
  on public.recipes for insert to authenticated
  with check (author_id = (select auth.uid()) and public.is_active_user() and status in ('draft', 'published'));
create policy "Authors update their own recipes"
  on public.recipes for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()) and public.is_active_user() and status in ('draft', 'published'));
create policy "Admins moderate recipes"
  on public.recipes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Authors and admins delete recipes"
  on public.recipes for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_admin());

-- Ingredients and steps follow their recipe.
create policy "Ingredients follow recipe visibility"
  on public.recipe_ingredients for select to anon, authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and (r.status = 'published' or r.author_id = (select auth.uid()) or public.is_admin())
  ));
create policy "Authors manage their recipe ingredients"
  on public.recipe_ingredients for all to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.author_id = (select auth.uid())))
  with check (
    public.is_active_user()
    and exists (select 1 from public.recipes r where r.id = recipe_id and r.author_id = (select auth.uid()))
  );

create policy "Steps follow recipe visibility"
  on public.recipe_steps for select to anon, authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and (r.status = 'published' or r.author_id = (select auth.uid()) or public.is_admin())
  ));
create policy "Authors manage their recipe steps"
  on public.recipe_steps for all to authenticated
  using (exists (select 1 from public.recipes r where r.id = recipe_id and r.author_id = (select auth.uid())))
  with check (
    public.is_active_user()
    and exists (select 1 from public.recipes r where r.id = recipe_id and r.author_id = (select auth.uid()))
  );

-- Owner-only personal tables.
create policy "Users manage their own favorites"
  on public.favorites for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_active_user());

create policy "Users manage their own collections"
  on public.collections for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_active_user());

create policy "Users manage recipes in their own collections"
  on public.collection_recipes for all to authenticated
  using (exists (select 1 from public.collections c where c.id = collection_id and c.user_id = (select auth.uid())))
  with check (
    public.is_active_user()
    and exists (select 1 from public.collections c where c.id = collection_id and c.user_id = (select auth.uid()))
  );

create policy "Users manage their own meal plan"
  on public.meal_plan_entries for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_active_user());

create policy "Users manage their own shopping list"
  on public.shopping_list_items for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_active_user());

create policy "Users manage their own cooking history"
  on public.cooked_log for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_active_user());

-- Reviews: public to read; one per user per recipe; owners edit, admins remove.
create policy "Reviews are viewable by everyone"
  on public.reviews for select to anon, authenticated using (true);
create policy "Users write their own reviews"
  on public.reviews for insert to authenticated
  with check (author_id = (select auth.uid()) and public.is_active_user());
create policy "Users update their own reviews"
  on public.reviews for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()) and public.is_active_user());
create policy "Authors and admins delete reviews"
  on public.reviews for delete to authenticated
  using (author_id = (select auth.uid()) or public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage: public-read image buckets; users write only inside <their-id>/
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('recipe-images', 'recipe-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Users read their own image files"
  on storage.objects for select to authenticated
  using (bucket_id in ('avatars', 'recipe-images') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users upload images to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'recipe-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_active_user()
  );
create policy "Users replace their own images"
  on storage.objects for update to authenticated
  using (bucket_id in ('avatars', 'recipe-images') and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id in ('avatars', 'recipe-images') and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete their own images"
  on storage.objects for delete to authenticated
  using (bucket_id in ('avatars', 'recipe-images') and (storage.foldername(name))[1] = (select auth.uid())::text);

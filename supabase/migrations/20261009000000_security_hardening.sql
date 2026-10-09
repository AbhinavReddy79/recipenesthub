-- RecipeNest: security hardening. Run after 20261007000000_init.sql.
-- Every statement is idempotent, so the whole file can be run again safely.

-- ---------------------------------------------------------------------------
-- 1. Members-only API: signed-out visitors can't read anything.
--    (The site requires an account; the API now matches.)
-- ---------------------------------------------------------------------------

revoke select on public.profiles, public.recipes, public.recipe_ingredients, public.recipe_steps,
  public.reviews, public.recipe_ratings from anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_active_user() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_active_user() to authenticated;

-- Sign-up checks whether a username is free before an account exists.
create or replace function public.username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select candidate ~ '^[a-z0-9_]{3,24}$'
    and not exists (select 1 from public.profiles where username = candidate);
$$;

revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Reserved recipe links. Saves, collections, plans and reviews refer to
--    recipes by slug, and deleting a community recipe clears references to its
--    slug. Without this, someone could create a recipe named like a catalog
--    recipe, delete it, and wipe everyone's saves of the catalog recipe.
--    Keep this list in sync with the catalog: npm run db:reserved-slugs
-- ---------------------------------------------------------------------------

create table if not exists public.reserved_slugs (slug text primary key);
alter table public.reserved_slugs enable row level security; -- no policies: not readable through the API
revoke all on public.reserved_slugs from anon, authenticated;

insert into public.reserved_slugs (slug) values
  ('aloo-gobi'),
  ('avocado-toast-poached-egg'),
  ('bbq-baby-back-ribs'),
  ('beef-birria-tacos'),
  ('berry-french-toast'),
  ('black-bean-tacos'),
  ('brown-butter-chocolate-chip-cookies'),
  ('butter-chicken'),
  ('buttermilk-fried-chicken'),
  ('chicken-souvlaki'),
  ('chicken-tikka-masala'),
  ('chocolate-fudge-layer-cake'),
  ('chole-bhature'),
  ('classic-smash-burger'),
  ('classic-tiramisu'),
  ('creamy-garlic-pasta'),
  ('crispy-orange-chicken'),
  ('crispy-vegetable-samosas'),
  ('dal-makhani'),
  ('dal-tadka'),
  ('egg-fried-rice'),
  ('eggs-benedict'),
  ('fluffy-buttermilk-pancakes'),
  ('fudgy-brownies'),
  ('grilled-lemon-chicken'),
  ('gulab-jamun'),
  ('hyderabadi-chicken-biryani'),
  ('iced-vanilla-latte'),
  ('idli-sambar'),
  ('kanda-poha'),
  ('kashmiri-rogan-josh'),
  ('kerala-fish-curry'),
  ('korean-bibimbap'),
  ('lamb-kofta-meatballs'),
  ('lemon-herb-salmon'),
  ('lemony-kale-chickpea-salad'),
  ('malai-kofta'),
  ('mango-lassi'),
  ('margherita-pizza'),
  ('masala-chai'),
  ('masala-dosa'),
  ('mezze-platter-with-hummus'),
  ('mumbai-pav-bhaji'),
  ('palak-paneer'),
  ('paneer-butter-masala'),
  ('penne-arrabbiata'),
  ('pork-and-chive-dumplings'),
  ('rainbow-buddha-bowl'),
  ('rajma-chawal'),
  ('roasted-pumpkin-soup'),
  ('salmon-avocado-sushi-rolls'),
  ('seafood-paella'),
  ('shrimp-scampi-spaghetti'),
  ('spaghetti-and-meatballs'),
  ('sparkling-lime-mocktail'),
  ('sparkling-strawberry-lemonade'),
  ('steak-frites'),
  ('strawberry-panna-cotta'),
  ('street-style-chicken-tacos'),
  ('tandoori-chicken'),
  ('thai-red-curry-noodle-soup'),
  ('tonkotsu-ramen'),
  ('tropical-smoothie-trio'),
  ('vegetable-chow-mein'),
  ('vegetable-dum-biryani'),
  ('vietnamese-beef-pho'),
  ('weeknight-shoyu-ramen')
on conflict (slug) do nothing;

create or replace function public.guard_recipe_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.slug is distinct from old.slug then
    raise exception 'A recipe''s link cannot be changed' using errcode = '42501';
  end if;
  if tg_op = 'INSERT' and exists (select 1 from public.reserved_slugs r where r.slug = new.slug) then
    raise exception 'That recipe link is reserved' using errcode = '23505';
  end if;
  return new;
end;
$$;

drop trigger if exists recipes_guard_slug on public.recipes;
create trigger recipes_guard_slug
  before insert or update on public.recipes
  for each row execute function public.guard_recipe_slug();

-- Belt and braces: never clear references to a catalog recipe.
create or replace function public.purge_recipe_references()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.reserved_slugs r where r.slug = old.slug) then
    return old;
  end if;
  delete from public.favorites where recipe_slug = old.slug;
  delete from public.collection_recipes where recipe_slug = old.slug;
  delete from public.meal_plan_entries where recipe_slug = old.slug;
  delete from public.reviews where recipe_slug = old.slug;
  delete from public.cooked_log where recipe_slug = old.slug;
  return old;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Image links must point at a file in our own storage (or Unsplash), so
--    nobody can embed another site's image (tracking pixels, broken pages).
-- ---------------------------------------------------------------------------

create or replace function public.is_allowed_image_url(url text, bucket text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select url is null
    or url = ''
    or (char_length(url) <= 1000 and url like 'https://images.unsplash.com/%')
    or (
      char_length(url) <= 1000
      and url ~ ('^https://[a-z0-9-]+\.supabase\.co/storage/v1/object/public/' || bucket || '/[^?#]+$')
      and exists (
        select 1 from storage.objects o
        where o.bucket_id = bucket
          and o.name = substring(url from '/storage/v1/object/public/' || bucket || '/([^?#]+)$')
      )
    );
$$;

revoke all on function public.is_allowed_image_url(text, text) from public, anon;
grant execute on function public.is_allowed_image_url(text, text) to authenticated;

create or replace function public.guard_recipe_image()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.image_url is distinct from old.image_url)
     and not public.is_allowed_image_url(new.image_url, 'recipe-images') then
    raise exception 'Recipe photos must be uploaded to RecipeNest' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists recipes_guard_image on public.recipes;
create trigger recipes_guard_image
  before insert or update on public.recipes
  for each row execute function public.guard_recipe_image();

create or replace function public.guard_profile_avatar()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.avatar_url is distinct from old.avatar_url
     and (select auth.uid()) is not null
     and not public.is_allowed_image_url(new.avatar_url, 'avatars') then
    raise exception 'Profile photos must be uploaded to RecipeNest' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_avatar on public.profiles;
create trigger profiles_guard_avatar
  before update on public.profiles
  for each row execute function public.guard_profile_avatar();

create or replace function public.guard_collection_cover()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' or new.cover_url is distinct from old.cover_url)
     and not public.is_allowed_image_url(new.cover_url, 'recipe-images') then
    raise exception 'Collection covers must be uploaded to RecipeNest' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists collections_guard_cover on public.collections;
create trigger collections_guard_cover
  before insert or update on public.collections
  for each row execute function public.guard_collection_cover();

-- ---------------------------------------------------------------------------
-- 4. Limits against abuse: how many rows one account can create, how fast,
--    and how big each value can be.
-- ---------------------------------------------------------------------------

-- True when NEW matches a row that already exists on the given key columns
-- (comma separated), i.e. an upsert that will update instead of insert.
create or replace function public.row_already_exists(schema_name text, table_name text, key_columns text, row_data jsonb)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  key_filter text := '';
  key_column text;
  found_row boolean;
begin
  foreach key_column in array string_to_array(key_columns, ',') loop
    key_filter := key_filter || format(' and %I::text = %L', key_column, row_data ->> key_column);
  end loop;
  execute format('select exists (select 1 from %I.%I where true %s)', schema_name, table_name, key_filter)
    into found_row;
  return found_row;
end;
$$;

revoke all on function public.row_already_exists(text, text, text, jsonb) from public, anon, authenticated;

-- Row cap per owner. Arguments: owner column, maximum rows, key columns.
create or replace function public.enforce_row_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb := to_jsonb(new);
  current_rows integer;
begin
  if public.row_already_exists(tg_table_schema, tg_table_name, tg_argv[2], row_data) then
    return new;
  end if;
  execute format('select count(*) from %I.%I where %I::text = %L', tg_table_schema, tg_table_name, tg_argv[0], row_data ->> tg_argv[0])
    into current_rows;
  if current_rows >= tg_argv[1]::integer then
    raise exception 'Limit reached: at most % of these per account', tg_argv[1] using errcode = '54000';
  end if;
  return new;
end;
$$;

-- New rows per owner per hour. Arguments: owner column, maximum per hour, key columns.
create or replace function public.enforce_hourly_rate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb := to_jsonb(new);
  recent integer;
begin
  if public.row_already_exists(tg_table_schema, tg_table_name, tg_argv[2], row_data) then
    return new;
  end if;
  execute format(
    'select count(*) from %I.%I where %I::text = %L and created_at > now() - interval ''1 hour''',
    tg_table_schema, tg_table_name, tg_argv[0], row_data ->> tg_argv[0]
  ) into recent;
  if recent >= tg_argv[1]::integer then
    raise exception 'You''re doing that too often. Please try again later.' using errcode = '54000';
  end if;
  return new;
end;
$$;

drop trigger if exists recipes_quota on public.recipes;
create trigger recipes_quota before insert on public.recipes
  for each row execute function public.enforce_row_quota('author_id', '200', 'id');
drop trigger if exists recipes_rate on public.recipes;
create trigger recipes_rate before insert on public.recipes
  for each row execute function public.enforce_hourly_rate('author_id', '20', 'id');

drop trigger if exists recipe_ingredients_quota on public.recipe_ingredients;
create trigger recipe_ingredients_quota before insert on public.recipe_ingredients
  for each row execute function public.enforce_row_quota('recipe_id', '100', 'id');
drop trigger if exists recipe_steps_quota on public.recipe_steps;
create trigger recipe_steps_quota before insert on public.recipe_steps
  for each row execute function public.enforce_row_quota('recipe_id', '60', 'id');

drop trigger if exists favorites_quota on public.favorites;
create trigger favorites_quota before insert on public.favorites
  for each row execute function public.enforce_row_quota('user_id', '2000', 'user_id,recipe_slug');

drop trigger if exists collections_quota on public.collections;
create trigger collections_quota before insert on public.collections
  for each row execute function public.enforce_row_quota('user_id', '100', 'id');
drop trigger if exists collections_rate on public.collections;
create trigger collections_rate before insert on public.collections
  for each row execute function public.enforce_hourly_rate('user_id', '30', 'id');

drop trigger if exists collection_recipes_quota on public.collection_recipes;
create trigger collection_recipes_quota before insert on public.collection_recipes
  for each row execute function public.enforce_row_quota('collection_id', '500', 'collection_id,recipe_slug');

drop trigger if exists shopping_list_items_quota on public.shopping_list_items;
create trigger shopping_list_items_quota before insert on public.shopping_list_items
  for each row execute function public.enforce_row_quota('user_id', '500', 'id');

drop trigger if exists reviews_quota on public.reviews;
create trigger reviews_quota before insert on public.reviews
  for each row execute function public.enforce_row_quota('author_id', '2000', 'id');
drop trigger if exists reviews_rate on public.reviews;
create trigger reviews_rate before insert on public.reviews
  for each row execute function public.enforce_hourly_rate('author_id', '30', 'id');

drop trigger if exists cooked_log_quota on public.cooked_log;
create trigger cooked_log_quota before insert on public.cooked_log
  for each row execute function public.enforce_row_quota('user_id', '5000', 'user_id,recipe_slug');

-- Size limits (NOT VALID: enforced for new and changed rows; existing rows are left alone).
alter table public.recipes drop constraint if exists recipes_size_limits;
alter table public.recipes add constraint recipes_size_limits check (
  cardinality(categories) <= 20 and cardinality(diets) <= 20 and cardinality(tags) <= 30
  and char_length(cuisine) <= 40 and char_length(meal_type) <= 40
  and char_length(image_url) <= 1000 and pg_column_size(nutrition) <= 2048
) not valid;

alter table public.recipe_ingredients drop constraint if exists recipe_ingredients_size_limits;
alter table public.recipe_ingredients add constraint recipe_ingredients_size_limits check (
  char_length(unit) <= 30 and (note is null or char_length(note) <= 200) and position between 0 and 1000
) not valid;

alter table public.recipe_steps drop constraint if exists recipe_steps_size_limits;
alter table public.recipe_steps add constraint recipe_steps_size_limits check (position between 0 and 1000) not valid;

alter table public.shopping_list_items drop constraint if exists shopping_list_items_size_limits;
alter table public.shopping_list_items add constraint shopping_list_items_size_limits check (
  char_length(unit) <= 30 and cardinality(sources) <= 50
  and (product_id is null or char_length(product_id) <= 100)
  and (product is null or pg_column_size(product) <= 4096)
) not valid;

alter table public.user_settings drop constraint if exists user_settings_size_limits;
alter table public.user_settings add constraint user_settings_size_limits check (
  char_length(diet) <= 40 and cardinality(favorite_cuisines) <= 30
) not valid;

alter table public.profiles drop constraint if exists profiles_size_limits;
alter table public.profiles add constraint profiles_size_limits check (char_length(avatar_url) <= 1000) not valid;

alter table public.collections drop constraint if exists collections_size_limits;
alter table public.collections add constraint collections_size_limits check (
  cover_url is null or char_length(cover_url) <= 1000
) not valid;

-- Recipe references must look like recipe links.
alter table public.favorites drop constraint if exists favorites_slug_format;
alter table public.favorites add constraint favorites_slug_format
  check (recipe_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(recipe_slug) <= 120) not valid;
alter table public.collection_recipes drop constraint if exists collection_recipes_slug_format;
alter table public.collection_recipes add constraint collection_recipes_slug_format
  check (recipe_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(recipe_slug) <= 120) not valid;
alter table public.meal_plan_entries drop constraint if exists meal_plan_entries_slug_format;
alter table public.meal_plan_entries add constraint meal_plan_entries_slug_format
  check (recipe_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(recipe_slug) <= 120) not valid;
alter table public.reviews drop constraint if exists reviews_slug_format;
alter table public.reviews add constraint reviews_slug_format
  check (recipe_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(recipe_slug) <= 120) not valid;
alter table public.cooked_log drop constraint if exists cooked_log_slug_format;
alter table public.cooked_log add constraint cooked_log_slug_format
  check (recipe_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(recipe_slug) <= 120) not valid;

-- Storage: at most 200 files per account in each bucket.
create or replace function public.my_image_count(bucket text)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from storage.objects
  where bucket_id = bucket and (storage.foldername(name))[1] = (select auth.uid())::text;
$$;

revoke all on function public.my_image_count(text) from public, anon;
grant execute on function public.my_image_count(text) to authenticated;

drop policy if exists "Users upload images to their own folder" on storage.objects;
create policy "Users upload images to their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'recipe-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and public.is_active_user()
    and public.my_image_count(bucket_id) < 200
  );

-- ---------------------------------------------------------------------------
-- 5. Trigger functions are never called directly; nobody needs EXECUTE on them.
--    (Postgres checks that privilege when a trigger is created, not when it fires.)
-- ---------------------------------------------------------------------------

revoke execute on function
  public.set_updated_at(),
  public.guard_profile_columns(),
  public.handle_new_user(),
  public.purge_recipe_references(),
  public.guard_recipe_slug(),
  public.guard_recipe_image(),
  public.guard_profile_avatar(),
  public.guard_collection_cover(),
  public.enforce_row_quota(),
  public.enforce_hourly_rate()
from public, anon, authenticated;

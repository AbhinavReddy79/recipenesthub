-- RecipeNest: per-admin powers. Run after the earlier migrations. Every
-- statement is idempotent.
--
-- The owner can do everything. Other admins only get the powers the owner
-- switches on for them (Admin > Users > Permissions):
--   moderate  - hide/publish/delete community recipes, edit/delete reviews (on by default)
--   members   - disable/delete members, see the users list, Premium, activity, invites
--   contests  - create/edit/delete contests, remove entries, announce winners
--   messages  - read, handle and delete Contact page messages
-- Always owner-only: making admins, these permissions, and
-- marking contest prizes as paid.

create table if not exists public.admin_permissions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  moderate boolean not null default true,
  members boolean not null default false,
  contests boolean not null default false,
  messages boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.admin_permissions enable row level security;
revoke all on public.admin_permissions from anon, authenticated;

-- Does the signed-in user have this power? (The owner always does; admins per the table, defaults if no row.)
create or replace function public.has_admin_power(power_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_owner()
    or (
      public.is_admin()
      and coalesce(
        (select case power_name
                  when 'moderate' then p.moderate
                  when 'members' then p.members
                  when 'contests' then p.contests
                  when 'messages' then p.messages
                  else false
                end
         from public.admin_permissions p where p.user_id = (select auth.uid())),
        power_name = 'moderate'
      )
    );
$$;

revoke all on function public.has_admin_power(text) from public, anon;
grant execute on function public.has_admin_power(text) to authenticated;

-- The signed-in admin's powers, for the console.
create or replace function public.my_admin_powers()
returns table (moderate boolean, members boolean, contests boolean, messages boolean, owner boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_admin_power('moderate'), public.has_admin_power('members'),
         public.has_admin_power('contests'), public.has_admin_power('messages'), public.is_owner();
$$;

revoke all on function public.my_admin_powers() from public, anon;
grant execute on function public.my_admin_powers() to authenticated;

-- Owner only: set an admin's powers.
create or replace function public.set_admin_powers(target uuid, p_moderate boolean, p_members boolean, p_contests boolean, p_messages boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception 'Only the site owner can change admin powers' using errcode = '42501';
  end if;
  insert into public.admin_permissions as a (user_id, moderate, members, contests, messages, updated_at)
  values (target, p_moderate, p_members, p_contests, p_messages, now())
  on conflict (user_id) do update
    set moderate = excluded.moderate, members = excluded.members, contests = excluded.contests,
        messages = excluded.messages, updated_at = now();
end;
$$;

revoke all on function public.set_admin_powers(uuid, boolean, boolean, boolean, boolean) from public, anon;
grant execute on function public.set_admin_powers(uuid, boolean, boolean, boolean, boolean) to authenticated;

-- Owner only: every admin's powers.
create or replace function public.owner_list_admin_powers()
returns table (user_id uuid, moderate boolean, members boolean, contests boolean, messages boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception 'Only the site owner can see admin powers' using errcode = '42501';
  end if;
  return query
    select pr.id, coalesce(a.moderate, true), coalesce(a.members, false), coalesce(a.contests, false), coalesce(a.messages, false)
    from public.profiles pr
    left join public.admin_permissions a on a.user_id = pr.id
    where pr.role = 'admin';
end;
$$;

revoke all on function public.owner_list_admin_powers() from public, anon;
grant execute on function public.owner_list_admin_powers() to authenticated;

-- ---------------------------------------------------------------------------
-- Moderation: recipes, their ingredients/steps, reviews
-- ---------------------------------------------------------------------------

drop policy if exists "Published recipes are public; authors see their own" on public.recipes;
create policy "Published recipes are public; authors see their own"
  on public.recipes for select to anon, authenticated
  using (status = 'published' or author_id = (select auth.uid()) or public.has_admin_power('moderate'));

drop policy if exists "Admins moderate recipes" on public.recipes;
create policy "Admins moderate recipes"
  on public.recipes for update to authenticated
  using (public.has_admin_power('moderate')) with check (public.has_admin_power('moderate'));

drop policy if exists "Authors and admins delete recipes" on public.recipes;
create policy "Authors and admins delete recipes"
  on public.recipes for delete to authenticated
  using (author_id = (select auth.uid()) or public.has_admin_power('moderate'));

drop policy if exists "Ingredients follow recipe visibility" on public.recipe_ingredients;
create policy "Ingredients follow recipe visibility"
  on public.recipe_ingredients for select to anon, authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and (r.status = 'published' or r.author_id = (select auth.uid()) or public.has_admin_power('moderate'))
  ));

drop policy if exists "Steps follow recipe visibility" on public.recipe_steps;
create policy "Steps follow recipe visibility"
  on public.recipe_steps for select to anon, authenticated
  using (exists (
    select 1 from public.recipes r
    where r.id = recipe_id and (r.status = 'published' or r.author_id = (select auth.uid()) or public.has_admin_power('moderate'))
  ));

drop policy if exists "Admins moderate reviews" on public.reviews;
create policy "Admins moderate reviews"
  on public.reviews for update to authenticated
  using (public.has_admin_power('moderate') and (public.is_owner() or not public.is_owner(author_id)))
  with check (public.has_admin_power('moderate') and (public.is_owner() or not public.is_owner(author_id)));

drop policy if exists "Authors and admins delete reviews" on public.reviews;
create policy "Authors and admins delete reviews"
  on public.reviews for delete to authenticated
  using (
    author_id = (select auth.uid())
    or (public.has_admin_power('moderate') and (public.is_owner() or not public.is_owner(author_id)))
  );

-- Publishing someone else's recipe during moderation doesn't use up their Free allowance.
create or replace function public.enforce_monthly_recipe_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status <> 'published'
     or (tg_op = 'UPDATE' and old.status = 'published')
     or exists (select 1 from public.recipe_publications where recipe_id = new.id) then
    return new; -- not a first publication
  end if;
  if not (public.has_admin_power('moderate') and new.author_id <> (select auth.uid()))
     and not public.is_premium(new.author_id)
     and public.recipes_published_this_month(new.author_id) >= 5 then
    raise exception 'monthly_recipe_limit: Free members can publish 5 recipes a month' using errcode = 'P0001';
  end if;
  insert into public.recipe_publications (recipe_id, author_id) values (new.id, new.author_id)
  on conflict (recipe_id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------

drop policy if exists "Admins update any profile" on public.profiles;
create policy "Admins update any profile"
  on public.profiles for update to authenticated
  using (public.has_admin_power('members') and not public.is_owner(id))
  with check (public.has_admin_power('members') and not public.is_owner(id));

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
  if (select auth.uid()) is null then
    return new;
  end if;
  if new.role is distinct from old.role or new.status is distinct from old.status then
    if public.is_owner(old.id) then
      raise exception 'The owner account cannot be changed' using errcode = '42501';
    end if;
    if old.id = (select auth.uid()) then
      raise exception 'You cannot change your own role or status' using errcode = '42501';
    end if;
  end if;
  if new.role is distinct from old.role and not public.is_owner() then
    raise exception 'Only the site owner can change who is an admin' using errcode = '42501';
  end if;
  if new.status is distinct from old.status then
    if not public.has_admin_power('members') then
      raise exception 'Only admins who manage members can suspend accounts' using errcode = '42501';
    end if;
    if old.role = 'admin' and not public.is_owner() then
      raise exception 'Only the site owner can suspend an admin' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_profile_columns() from public, anon, authenticated;

create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_admin_power('members') then
    raise exception 'Admins who manage members only' using errcode = '42501';
  end if;
  if target = (select auth.uid()) then
    raise exception 'Use account settings to delete your own account';
  end if;
  if public.is_owner(target) then
    raise exception 'The owner account cannot be deleted' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where id = target and role = 'admin') and not public.is_owner() then
    raise exception 'Only the site owner can delete an admin' using errcode = '42501';
  end if;
  delete from auth.users where id = target;
end;
$$;

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
  created_at timestamptz,
  is_owner boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_admin_power('members') then
    raise exception 'Admins who manage members only' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.username, p.name, p.avatar_url, p.bio, p.location, p.role, p.status, p.created_at,
           exists (select 1 from public.app_owner o where o.user_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

drop policy if exists "Members read their own plan" on public.subscriptions;
create policy "Members read their own plan"
  on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or public.has_admin_power('members'));

create or replace function public.admin_set_premium(target uuid, days integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_admin_power('members') then
    raise exception 'Only admins who manage members can change plans' using errcode = '42501';
  end if;
  if days < 0 or days > 3660 then
    raise exception 'Choose between 0 and 3660 days' using errcode = '22023';
  end if;
  if days = 0 then
    update public.subscriptions set premium_until = now(), status = 'none', updated_at = now() where user_id = target;
  else
    perform public.extend_premium(target, make_interval(days => days), 'granted');
  end if;
end;
$$;

create or replace function public.admin_list_plans()
returns table (user_id uuid, premium boolean, premium_until timestamptz, period text, status text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_admin_power('members') then
    raise exception 'Only admins who manage members can see plans' using errcode = '42501';
  end if;
  return query
    select s.user_id, s.premium_until > now(), s.premium_until, s.period, s.status from public.subscriptions s;
end;
$$;

create or replace function public.admin_list_presence()
returns table (user_id uuid, last_seen_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_admin_power('members') then
    raise exception 'Only admins who manage members can see activity' using errcode = '42501';
  end if;
  return query select a.user_id, a.last_seen_at from public.user_activity a;
end;
$$;

-- ---------------------------------------------------------------------------
-- Contests
-- ---------------------------------------------------------------------------

drop policy if exists "Admins create contests" on public.contests;
create policy "Admins create contests" on public.contests for insert to authenticated
  with check (public.has_admin_power('contests'));
drop policy if exists "Admins edit contests" on public.contests;
create policy "Admins edit contests" on public.contests for update to authenticated
  using (public.has_admin_power('contests')) with check (public.has_admin_power('contests'));
drop policy if exists "Admins delete contests" on public.contests;
create policy "Admins delete contests" on public.contests for delete to authenticated
  using (public.has_admin_power('contests'));

-- Recording a cash prize as paid is owner-only.
create or replace function public.guard_contest_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.prize_paid is distinct from old.prize_paid and (select auth.uid()) is not null and not public.is_owner() then
    raise exception 'Only the site owner can mark prizes as paid' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_contest_columns() from public, anon, authenticated;

drop trigger if exists contests_guard_columns on public.contests;
create trigger contests_guard_columns
  before update on public.contests
  for each row execute function public.guard_contest_columns();

drop policy if exists "Members withdraw, admins remove entries" on public.contest_entries;
create policy "Members withdraw, admins remove entries" on public.contest_entries
  for delete to authenticated
  using ((user_id = (select auth.uid()) and public.contest_is_open(contest_id)) or public.has_admin_power('contests'));

drop policy if exists "Members see their own votes" on public.contest_votes;
create policy "Members see their own votes" on public.contest_votes
  for select to authenticated using (user_id = (select auth.uid()) or public.has_admin_power('contests'));

create or replace function public.contest_entries_with_votes(p_contest uuid)
returns table (
  entry_id uuid,
  recipe_id uuid,
  recipe_slug text,
  recipe_title text,
  recipe_image text,
  user_id uuid,
  author_name text,
  author_username text,
  author_avatar text,
  votes integer,
  voted_by_me boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select e.id, r.id, r.slug, r.title, r.image_url, p.id, p.name, p.username, p.avatar_url,
         (select count(*)::integer from public.contest_votes v where v.entry_id = e.id),
         exists (select 1 from public.contest_votes v where v.entry_id = e.id and v.user_id = (select auth.uid())),
         e.created_at
  from public.contest_entries e
  join public.recipes r on r.id = e.recipe_id
  join public.profiles p on p.id = e.user_id
  where e.contest_id = p_contest
    and (select auth.uid()) is not null
    and (r.status = 'published' or public.has_admin_power('contests'))
  order by 10 desc, e.created_at asc;
$$;

create or replace function public.admin_announce_winner(p_contest uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.contests;
  winner record;
begin
  if not public.has_admin_power('contests') then
    raise exception 'Only admins who manage contests can announce winners' using errcode = '42501';
  end if;
  select * into c from public.contests where id = p_contest for update;
  if not found then
    raise exception 'Contest not found' using errcode = '22023';
  end if;
  if c.announced_at is not null then
    raise exception 'The winner has already been announced' using errcode = '22023';
  end if;
  if now() < c.ends_at then
    raise exception 'This contest is still running' using errcode = '22023';
  end if;

  select e.id, e.user_id into winner
  from public.contest_entries e
  join public.recipes r on r.id = e.recipe_id and r.status = 'published'
  left join public.contest_votes v on v.entry_id = e.id
  where e.contest_id = p_contest
  group by e.id, e.user_id, e.created_at
  order by count(v.user_id) desc, e.created_at asc
  limit 1;

  update public.contests set winner_entry_id = winner.id, announced_at = now() where id = p_contest;
  if winner.id is not null then
    perform public.extend_premium(winner.user_id, interval '1 month', 'granted');
  end if;
  return winner.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Contact messages
-- ---------------------------------------------------------------------------

drop policy if exists "Admins read messages" on public.contact_messages;
create policy "Admins read messages" on public.contact_messages
  for select to authenticated using (public.has_admin_power('messages'));

drop policy if exists "Admins mark messages handled" on public.contact_messages;
create policy "Admins mark messages handled" on public.contact_messages
  for update to authenticated using (public.has_admin_power('messages')) with check (public.has_admin_power('messages'));

drop policy if exists "Admins delete messages" on public.contact_messages;
create policy "Admins delete messages" on public.contact_messages
  for delete to authenticated using (public.has_admin_power('messages'));

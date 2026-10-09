-- RecipeNest: a site owner who controls admin access. Run after the earlier migrations.
--
-- The owner is the only account that can make other users admins (or remove
-- that), and nobody can suspend, demote or delete the owner. Admins can still
-- moderate: suspend regular users, delete regular accounts and manage recipes.
-- Every statement is idempotent.

create table if not exists public.app_owner (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  singleton boolean not null default true unique check (singleton)
);
alter table public.app_owner enable row level security; -- no policies: not readable through the API
revoke all on public.app_owner from anon, authenticated;

create or replace function public.is_owner(target uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_owner
    where user_id = coalesce(target, (select auth.uid()))
  );
$$;

revoke all on function public.is_owner(uuid) from public, anon;
grant execute on function public.is_owner(uuid) to authenticated;

-- Who may change a profile's role and status (changes from the SQL Editor,
-- where there is no signed-in user, are always allowed).
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
    if not public.is_admin() then
      raise exception 'Only admins can suspend accounts' using errcode = '42501';
    end if;
    if old.role = 'admin' and not public.is_owner() then
      raise exception 'Only the site owner can suspend an admin' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_profile_columns() from public, anon, authenticated;

-- Admins may edit other profiles, but never the owner's.
drop policy if exists "Admins update any profile" on public.profiles;
create policy "Admins update any profile"
  on public.profiles for update to authenticated
  using (public.is_admin() and not public.is_owner(id))
  with check (public.is_admin() and not public.is_owner(id));

-- Admin console: delete another account (never the owner; admins only by the owner).
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
  if public.is_owner(target) then
    raise exception 'The owner account cannot be deleted' using errcode = '42501';
  end if;
  if exists (select 1 from public.profiles where id = target and role = 'admin') and not public.is_owner() then
    raise exception 'Only the site owner can delete an admin' using errcode = '42501';
  end if;
  delete from auth.users where id = target;
end;
$$;

-- Admin console list, now with an owner flag. (The return type changes, so recreate it.)
drop function if exists public.admin_list_users();
create function public.admin_list_users()
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
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.username, p.name, p.avatar_url, p.bio, p.location, p.role, p.status, p.created_at,
           exists (select 1 from public.app_owner o where o.user_id = p.id)
    from public.profiles p
    join auth.users u on u.id = p.id
    order by p.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
revoke all on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- To make an account the owner (and admin), run once in the SQL Editor:
--   insert into public.app_owner (user_id)
--     select id from auth.users where email = 'you@example.com'
--   on conflict (singleton) do update set user_id = excluded.user_id;
--   update public.profiles set role = 'admin', status = 'active'
--     where id = (select user_id from public.app_owner);

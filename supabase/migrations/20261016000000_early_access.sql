-- RecipeNest: early access before launch. Run after the earlier migrations.
-- Every statement is idempotent.
--
-- Before the public launch only the owner gets past the countdown, plus anyone
-- the owner puts on this list. Only the owner can change the list.

create table if not exists public.early_access (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  granted_at timestamptz not null default now()
);

alter table public.early_access enable row level security;
revoke all on public.early_access from anon, authenticated;

-- May the signed-in member use the site before launch? (The owner, or an active member on the list.)
create or replace function public.has_site_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_owner()
    or exists (
      select 1 from public.early_access e
      join public.profiles p on p.id = e.user_id
      where e.user_id = (select auth.uid()) and p.status = 'active'
    );
$$;

revoke all on function public.has_site_access() from public, anon;
grant execute on function public.has_site_access() to authenticated;

-- The owner adds or removes someone.
create or replace function public.set_early_access(target uuid, allowed boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception 'Only the site owner can give early access' using errcode = '42501';
  end if;
  if allowed then
    insert into public.early_access (user_id) values (target) on conflict (user_id) do nothing;
  else
    delete from public.early_access where user_id = target;
  end if;
end;
$$;

revoke all on function public.set_early_access(uuid, boolean) from public, anon;
grant execute on function public.set_early_access(uuid, boolean) to authenticated;

-- Admins: who has early access.
create or replace function public.admin_list_early_access()
returns setof uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can see this' using errcode = '42501';
  end if;
  return query select e.user_id from public.early_access e;
end;
$$;

revoke all on function public.admin_list_early_access() from public, anon;
grant execute on function public.admin_list_early_access() to authenticated;

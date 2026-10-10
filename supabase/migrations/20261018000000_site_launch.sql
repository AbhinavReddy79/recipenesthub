-- RecipeNest: the owner launches the site with a button. Run after the earlier
-- migrations. Every statement is idempotent.
--
-- Until the owner presses "Launch" in the admin dashboard, everyone except the
-- owner sees the countdown. The countdown date is only
-- shown to visitors; it doesn't open the site by itself.

create table if not exists public.site_status (
  id boolean primary key default true check (id),
  launched_at timestamptz,
  launched_by uuid references public.profiles (id) on delete set null
);

insert into public.site_status (id) values (true) on conflict (id) do nothing;

alter table public.site_status enable row level security;
revoke all on public.site_status from anon, authenticated;

-- Is the site open to everyone? (Anyone may ask: the countdown page checks it.)
create or replace function public.site_is_launched()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select launched_at is not null and launched_at <= now() from public.site_status where id), false);
$$;

revoke all on function public.site_is_launched() from public;
grant execute on function public.site_is_launched() to anon, authenticated;

-- When it launched (owner only), for the dashboard.
create or replace function public.owner_site_status()
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception 'Only the site owner can see this' using errcode = '42501';
  end if;
  return (select launched_at from public.site_status where id);
end;
$$;

-- Owner only: open the site to everyone now, or (launched = false) go back to the countdown.
create or replace function public.owner_set_launched(launched boolean)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  result timestamptz;
begin
  if not public.is_owner() then
    raise exception 'Only the site owner can launch the site' using errcode = '42501';
  end if;
  update public.site_status
    set launched_at = case when launched then coalesce(launched_at, now()) else null end,
        launched_by = case when launched then (select auth.uid()) else null end
    where id
    returning launched_at into result;
  return result;
end;
$$;

revoke all on function public.owner_site_status() from public, anon;
revoke all on function public.owner_set_launched(boolean) from public, anon;
grant execute on function public.owner_site_status() to authenticated;
grant execute on function public.owner_set_launched(boolean) to authenticated;

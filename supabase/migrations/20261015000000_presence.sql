-- RecipeNest: "who's online" for the admin console. Run after the earlier
-- migrations. Every statement is idempotent.
--
-- While a member has the site open in a visible tab, the app calls
-- touch_last_seen() about once a minute. Admins see a green dot for members
-- seen in the last 2 minutes and "last seen" times for everyone else.
-- Activity lives in its own table that clients can't read: only the admin
-- function below returns it.

create table if not exists public.user_activity (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  last_seen_at timestamptz not null default now()
);

alter table public.user_activity enable row level security;
revoke all on public.user_activity from anon, authenticated;

-- Records that the signed-in member is using the site (at most once every 30 seconds).
create or replace function public.touch_last_seen()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    return;
  end if;
  insert into public.user_activity as a (user_id, last_seen_at)
  values ((select auth.uid()), now())
  on conflict (user_id) do update
    set last_seen_at = now()
    where a.last_seen_at < now() - interval '30 seconds';
end;
$$;

revoke all on function public.touch_last_seen() from public, anon;
grant execute on function public.touch_last_seen() to authenticated;

-- Admins: when each member was last active (null = not seen since this was added).
create or replace function public.admin_list_presence()
returns table (user_id uuid, last_seen_at timestamptz)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can see activity' using errcode = '42501';
  end if;
  return query select a.user_id, a.last_seen_at from public.user_activity a;
end;
$$;

revoke all on function public.admin_list_presence() from public, anon;
grant execute on function public.admin_list_presence() to authenticated;

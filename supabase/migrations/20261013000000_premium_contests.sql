-- RecipeNest: Free and Premium plans (paid with Razorpay) and weekly contests.
-- Run after the earlier migrations. Every statement is idempotent.
--
-- Plans
--   Free:    publish up to 5 recipes per calendar month (India time).
--   Premium: unlimited recipes and entry to the weekly contest.
--            ₹79 a month or ₹899 a year, billed by Razorpay.
--
-- Premium can only be switched on by the functions below: after checking a
-- Razorpay signature (payment or webhook) with secrets kept in Supabase Vault,
-- or by an admin. Clients can read their own plan but never write it.
--
-- One-time setup (Supabase SQL Editor), with the values from Razorpay:
--   select vault.create_secret('<Razorpay key secret>', 'razorpay_key_secret');
--   select vault.create_secret('<Razorpay webhook secret>', 'razorpay_webhook_secret');

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------

create table if not exists public.subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  -- Premium while now() < premium_until.
  premium_until timestamptz,
  period text check (period in ('monthly', 'yearly')),
  status text not null default 'none'
    check (status in ('none', 'pending', 'active', 'cancelled', 'halted', 'paused', 'completed', 'granted')),
  razorpay_subscription_id text unique,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;

drop policy if exists "Members read their own plan" on public.subscriptions;
create policy "Members read their own plan"
  on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create or replace function public.is_premium(target uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = coalesce(target, (select auth.uid())) and premium_until > now()
  );
$$;

revoke all on function public.is_premium(uuid) from public, anon;
grant execute on function public.is_premium(uuid) to authenticated;

-- Adds time to a member's Premium, starting from now or from when it would end.
create or replace function public.extend_premium(target uuid, extra interval, new_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.subscriptions as s (user_id, premium_until, status)
  values (target, now() + extra, new_status)
  on conflict (user_id) do update
    set premium_until = greatest(coalesce(s.premium_until, now()), now()) + extra,
        status = case when s.status in ('active') then s.status else excluded.status end,
        updated_at = now();
end;
$$;

revoke all on function public.extend_premium(uuid, interval, text) from public, anon, authenticated;

create or replace function public.razorpay_secret(secret_name text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  value text;
begin
  select decrypted_secret into value from vault.decrypted_secrets where name = secret_name;
  if value is null or value = '' then
    raise exception 'Payments are not set up yet' using errcode = '55000';
  end if;
  return value;
end;
$$;

revoke all on function public.razorpay_secret(text) from public, anon, authenticated;

-- Step 1 of checkout (called by the app's server right after it creates the
-- Razorpay subscription): remember which subscription belongs to this member.
create or replace function public.billing_start(p_subscription_id text, p_period text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not public.is_active_user() then
    raise exception 'Please log in again' using errcode = '42501';
  end if;
  if p_period not in ('monthly', 'yearly') or p_subscription_id !~ '^sub_[A-Za-z0-9]{6,40}$' then
    raise exception 'Invalid subscription' using errcode = '22023';
  end if;
  insert into public.subscriptions as s (user_id, period, status, razorpay_subscription_id)
  values ((select auth.uid()), p_period, 'pending', p_subscription_id)
  on conflict (user_id) do update
    set period = excluded.period,
        razorpay_subscription_id = excluded.razorpay_subscription_id,
        status = case when s.premium_until > now() then s.status else 'pending' end,
        updated_at = now();
end;
$$;

-- Step 2 of checkout (called from the browser with what Razorpay returned):
-- the signature proves the payment is real, so Premium starts straight away.
create or replace function public.billing_confirm(p_payment_id text, p_subscription_id text, p_signature text)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected text;
  sub public.subscriptions;
begin
  select * into sub from public.subscriptions
  where user_id = (select auth.uid()) and razorpay_subscription_id = p_subscription_id;
  if not found then
    raise exception 'Subscription not found' using errcode = '42501';
  end if;
  expected := encode(extensions.hmac(p_payment_id || '|' || p_subscription_id, public.razorpay_secret('razorpay_key_secret'), 'sha256'), 'hex');
  if p_signature is null or expected <> lower(p_signature) then
    raise exception 'Payment could not be verified' using errcode = '42501';
  end if;
  update public.subscriptions
    set status = 'active',
        premium_until = greatest(
          coalesce(premium_until, now()),
          now() + case when period = 'yearly' then interval '1 year' else interval '1 month' end
        ),
        updated_at = now()
    where user_id = sub.user_id
    returning premium_until into sub.premium_until;
  return sub.premium_until;
end;
$$;

-- Razorpay webhooks (renewals, cancellations). Anyone may call it, but only a
-- body signed with the webhook secret changes anything.
create or replace function public.billing_webhook(p_body text, p_signature text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  payload jsonb;
  entity jsonb;
  event text;
  current_end timestamptz;
begin
  if p_signature is null
     or encode(extensions.hmac(p_body, public.razorpay_secret('razorpay_webhook_secret'), 'sha256'), 'hex') <> lower(p_signature) then
    raise exception 'Invalid signature' using errcode = '42501';
  end if;
  payload := p_body::jsonb;
  event := payload ->> 'event';
  entity := payload -> 'payload' -> 'subscription' -> 'entity';
  if entity is null or entity ->> 'id' is null then
    return; -- not a subscription event
  end if;
  current_end := to_timestamp(nullif(entity ->> 'current_end', '')::bigint);

  if event in ('subscription.activated', 'subscription.charged', 'subscription.resumed') then
    update public.subscriptions
      set status = 'active',
          premium_until = greatest(coalesce(premium_until, now()), coalesce(current_end, now())),
          updated_at = now()
      where razorpay_subscription_id = entity ->> 'id';
  elsif event in ('subscription.cancelled', 'subscription.halted', 'subscription.paused', 'subscription.completed') then
    -- Premium simply runs out at premium_until (already paid for).
    update public.subscriptions
      set status = split_part(event, '.', 2), updated_at = now()
      where razorpay_subscription_id = entity ->> 'id';
  end if;
end;
$$;

-- After the member cancels in the app (Razorpay stops renewing at the end of the period).
create or replace function public.billing_mark_cancelled()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.subscriptions set status = 'cancelled', updated_at = now()
  where user_id = (select auth.uid()) and status in ('active', 'pending');
$$;

-- Admins can give (days > 0) or take away (days = 0) Premium, e.g. for a UPI payment.
create or replace function public.admin_set_premium(target uuid, days integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change plans' using errcode = '42501';
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

revoke all on function public.billing_start(text, text) from public, anon;
revoke all on function public.billing_confirm(text, text, text) from public, anon;
revoke all on function public.billing_mark_cancelled() from public, anon;
revoke all on function public.admin_set_premium(uuid, integer) from public, anon;
revoke all on function public.billing_webhook(text, text) from public;
grant execute on function public.billing_start(text, text) to authenticated;
grant execute on function public.billing_confirm(text, text, text) to authenticated;
grant execute on function public.billing_mark_cancelled() to authenticated;
grant execute on function public.admin_set_premium(uuid, integer) to authenticated;
grant execute on function public.billing_webhook(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Free plan: 5 recipes a month
-- ---------------------------------------------------------------------------

-- Every first publication, kept even if the recipe is deleted later (so deleting
-- and re-posting doesn't reset the monthly count). Not readable by clients.
create table if not exists public.recipe_publications (
  recipe_id uuid not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  published_at timestamptz not null default now(),
  primary key (recipe_id)
);
create index if not exists recipe_publications_author_idx on public.recipe_publications (author_id, published_at);
alter table public.recipe_publications enable row level security;
revoke all on public.recipe_publications from anon, authenticated;

create or replace function public.month_start_ist()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
$$;

create or replace function public.recipes_published_this_month(target uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.recipe_publications
  where author_id = target and published_at >= public.month_start_ist();
$$;

revoke all on function public.recipes_published_this_month(uuid) from public, anon, authenticated;

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
  -- Admins publishing someone else's recipe (moderation) don't use up the author's allowance.
  if not (public.is_admin() and new.author_id <> (select auth.uid()))
     and not public.is_premium(new.author_id)
     and public.recipes_published_this_month(new.author_id) >= 5 then
    raise exception 'monthly_recipe_limit: Free members can publish 5 recipes a month' using errcode = 'P0001';
  end if;
  insert into public.recipe_publications (recipe_id, author_id) values (new.id, new.author_id)
  on conflict (recipe_id) do nothing;
  return new;
end;
$$;

drop trigger if exists recipes_monthly_limit on public.recipes;
create trigger recipes_monthly_limit
  before insert or update of status on public.recipes
  for each row execute function public.enforce_monthly_recipe_limit();

-- Recipes already published before this migration count as publications.
insert into public.recipe_publications (recipe_id, author_id, published_at)
select id, author_id, created_at from public.recipes where status = 'published'
on conflict (recipe_id) do nothing;

-- The signed-in member's plan, for the app.
create or replace function public.my_plan()
returns table (
  premium boolean,
  premium_until timestamptz,
  period text,
  status text,
  has_razorpay boolean,
  recipes_this_month integer,
  monthly_limit integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.is_premium(),
    s.premium_until,
    s.period,
    coalesce(s.status, 'none'),
    s.razorpay_subscription_id is not null,
    public.recipes_published_this_month((select auth.uid())),
    case when public.is_premium() then null else 5 end
  from (select 1) as one
  left join public.subscriptions s on s.user_id = (select auth.uid());
$$;

revoke all on function public.my_plan() from public, anon;
grant execute on function public.my_plan() to authenticated;

-- ---------------------------------------------------------------------------
-- Weekly contests
-- ---------------------------------------------------------------------------

create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 600),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- Cash prize in rupees, paid by the owner outside the app.
  prize_amount integer not null default 0 check (prize_amount between 0 and 1000000),
  winner_entry_id uuid,
  announced_at timestamptz,
  prize_paid boolean not null default false,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.contest_entries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (contest_id, user_id),
  unique (contest_id, recipe_id)
);
create index if not exists contest_entries_contest_idx on public.contest_entries (contest_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contests_winner_entry_fkey') then
    alter table public.contests
      add constraint contests_winner_entry_fkey foreign key (winner_entry_id)
      references public.contest_entries (id) on delete set null;
  end if;
end;
$$;

create table if not exists public.contest_votes (
  entry_id uuid not null references public.contest_entries (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, user_id)
);

alter table public.contests enable row level security;
alter table public.contest_entries enable row level security;
alter table public.contest_votes enable row level security;

revoke all on public.contests, public.contest_entries, public.contest_votes from anon, authenticated;
grant select, insert, update, delete on public.contests to authenticated;
grant select, insert, delete on public.contest_entries to authenticated;
grant select, insert, delete on public.contest_votes to authenticated;

create or replace function public.contest_is_open(p_contest uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.contests
    where id = p_contest and now() >= starts_at and now() < ends_at and announced_at is null
  );
$$;

revoke all on function public.contest_is_open(uuid) from public, anon;
grant execute on function public.contest_is_open(uuid) to authenticated;

drop policy if exists "Members see contests" on public.contests;
create policy "Members see contests" on public.contests for select to authenticated using (true);
drop policy if exists "Admins create contests" on public.contests;
create policy "Admins create contests" on public.contests for insert to authenticated with check (public.is_admin());
drop policy if exists "Admins edit contests" on public.contests;
create policy "Admins edit contests" on public.contests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins delete contests" on public.contests;
create policy "Admins delete contests" on public.contests for delete to authenticated using (public.is_admin());

drop policy if exists "Members see entries" on public.contest_entries;
create policy "Members see entries" on public.contest_entries for select to authenticated using (true);
drop policy if exists "Premium members enter their own published recipe" on public.contest_entries;
create policy "Premium members enter their own published recipe" on public.contest_entries
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_active_user()
    and public.is_premium()
    and public.contest_is_open(contest_id)
    and exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.author_id = (select auth.uid()) and r.status = 'published'
    )
  );
drop policy if exists "Members withdraw, admins remove entries" on public.contest_entries;
create policy "Members withdraw, admins remove entries" on public.contest_entries
  for delete to authenticated
  using ((user_id = (select auth.uid()) and public.contest_is_open(contest_id)) or public.is_admin());

drop policy if exists "Members see their own votes" on public.contest_votes;
create policy "Members see their own votes" on public.contest_votes
  for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists "Members vote for other people's entries" on public.contest_votes;
create policy "Members vote for other people's entries" on public.contest_votes
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_active_user()
    and exists (
      select 1 from public.contest_entries e
      where e.id = entry_id and e.user_id <> (select auth.uid()) and public.contest_is_open(e.contest_id)
    )
  );
drop policy if exists "Members take back their vote" on public.contest_votes;
create policy "Members take back their vote" on public.contest_votes
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (select 1 from public.contest_entries e where e.id = entry_id and public.contest_is_open(e.contest_id))
  );

-- Abuse limits, using the helpers from the security migration.
drop trigger if exists contest_votes_rate on public.contest_votes;
create trigger contest_votes_rate before insert on public.contest_votes
  for each row execute function public.enforce_hourly_rate('user_id', '120', 'entry_id,user_id');
drop trigger if exists contest_entries_rate on public.contest_entries;
create trigger contest_entries_rate before insert on public.contest_entries
  for each row execute function public.enforce_hourly_rate('user_id', '10', 'id');

-- A contest's entries with their vote counts (votes themselves stay private).
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
    and (r.status = 'published' or public.is_admin())
  order by 10 desc, e.created_at asc;
$$;

revoke all on function public.contest_entries_with_votes(uuid) from public, anon;
grant execute on function public.contest_entries_with_votes(uuid) to authenticated;

-- After a contest ends: the entry with the most votes wins (earliest entry on a
-- tie) and gets a free month of Premium. The cash prize is paid by the owner.
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
  if not public.is_admin() then
    raise exception 'Only admins can announce winners' using errcode = '42501';
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

revoke all on function public.admin_announce_winner(uuid) from public, anon;
grant execute on function public.admin_announce_winner(uuid) to authenticated;

-- Admins see each member's plan in the console.
create or replace function public.admin_list_plans()
returns table (user_id uuid, premium boolean, premium_until timestamptz, period text, status text)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can see plans' using errcode = '42501';
  end if;
  return query
    select s.user_id, s.premium_until > now(), s.premium_until, s.period, s.status from public.subscriptions s;
end;
$$;

revoke all on function public.admin_list_plans() from public, anon;
grant execute on function public.admin_list_plans() to authenticated;

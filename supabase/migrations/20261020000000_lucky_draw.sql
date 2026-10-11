-- RecipeNest: Premium is won, not bought. Weekly lucky draws replace payments.
-- Run after the earlier migrations. Every statement is idempotent.
--
-- - An admin with the "Manage contests" power (or the owner) creates a draw
--   with its dates, number of winners and cash prize per winner.
-- - Any active member may join an open draw once.
-- - After it closes, the admin presses "Draw winners": the database picks
--   random entries and gives each winner 3 months of Premium. The owner pays
--   the cash prize and marks it paid.
-- - The Razorpay payment functions are removed. Existing Premium (subscriptions
--   table) keeps working; it's now only granted by draws, contests and admins.

-- ---------------------------------------------------------------------------
-- Remove payments
-- ---------------------------------------------------------------------------

drop function if exists public.billing_start(text, text);
drop function if exists public.billing_confirm(text, text, text);
drop function if exists public.billing_webhook(text, text);
drop function if exists public.billing_mark_cancelled();
drop function if exists public.razorpay_secret(text);

-- ---------------------------------------------------------------------------
-- Lucky draws
-- ---------------------------------------------------------------------------

create table if not exists public.lucky_draws (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Weekly lucky draw' check (char_length(title) between 3 and 80),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  winners_count integer not null default 3 check (winners_count between 1 and 50),
  -- Cash prize per winner in rupees, paid by the owner outside the app.
  cash_prize integer not null default 0 check (cash_prize between 0 and 1000000),
  drawn_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.lucky_draw_entries (
  draw_id uuid not null references public.lucky_draws (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  winner boolean not null default false,
  prize_paid boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (draw_id, user_id)
);

alter table public.lucky_draws enable row level security;
alter table public.lucky_draw_entries enable row level security;
revoke all on public.lucky_draws, public.lucky_draw_entries from anon, authenticated;
grant select, insert, update, delete on public.lucky_draws to authenticated;
grant select, insert, delete on public.lucky_draw_entries to authenticated;

create or replace function public.lucky_draw_is_open(p_draw uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lucky_draws
    where id = p_draw and now() >= starts_at and now() < ends_at and drawn_at is null
  );
$$;

revoke all on function public.lucky_draw_is_open(uuid) from public, anon;
grant execute on function public.lucky_draw_is_open(uuid) to authenticated;

drop policy if exists "Members see draws" on public.lucky_draws;
create policy "Members see draws" on public.lucky_draws for select to authenticated using (true);
drop policy if exists "Contest admins create draws" on public.lucky_draws;
create policy "Contest admins create draws" on public.lucky_draws for insert to authenticated
  with check (public.has_admin_power('contests'));
drop policy if exists "Contest admins edit draws" on public.lucky_draws;
create policy "Contest admins edit draws" on public.lucky_draws for update to authenticated
  using (public.has_admin_power('contests')) with check (public.has_admin_power('contests'));
drop policy if exists "Contest admins delete draws" on public.lucky_draws;
create policy "Contest admins delete draws" on public.lucky_draws for delete to authenticated
  using (public.has_admin_power('contests'));

-- Winners can't be set by editing the row directly: only admin_draw_winners does that.
create or replace function public.guard_lucky_draw_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.drawn_at is distinct from old.drawn_at
     and (select auth.uid()) is not null
     and coalesce(current_setting('recipenest.drawing_winners', true), '') <> 'on' then
    raise exception 'Use "Draw winners" to pick winners' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_lucky_draw_columns() from public, anon, authenticated;

drop trigger if exists lucky_draws_guard_columns on public.lucky_draws;
create trigger lucky_draws_guard_columns
  before update on public.lucky_draws
  for each row execute function public.guard_lucky_draw_columns();

-- Entries: members see only their own; they join and leave while the draw is open.
drop policy if exists "Members see their own entries" on public.lucky_draw_entries;
create policy "Members see their own entries" on public.lucky_draw_entries
  for select to authenticated using (user_id = (select auth.uid()) or public.has_admin_power('contests'));
drop policy if exists "Members join open draws" on public.lucky_draw_entries;
create policy "Members join open draws" on public.lucky_draw_entries
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and winner = false and prize_paid = false
    and public.is_active_user()
    and public.lucky_draw_is_open(draw_id)
  );
drop policy if exists "Members leave open draws" on public.lucky_draw_entries;
create policy "Members leave open draws" on public.lucky_draw_entries
  for delete to authenticated
  using (user_id = (select auth.uid()) and public.lucky_draw_is_open(draw_id));

drop trigger if exists lucky_draw_entries_rate on public.lucky_draw_entries;
create trigger lucky_draw_entries_rate before insert on public.lucky_draw_entries
  for each row execute function public.enforce_hourly_rate('user_id', '20', 'draw_id,user_id');

-- Public facts about each draw: how many joined, whether you did, and the winners' names.
create or replace function public.lucky_draw_summary(p_draw uuid)
returns table (entries integer, joined boolean, i_won boolean, winners jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*)::integer from public.lucky_draw_entries e where e.draw_id = p_draw),
    exists (select 1 from public.lucky_draw_entries e where e.draw_id = p_draw and e.user_id = (select auth.uid())),
    exists (select 1 from public.lucky_draw_entries e where e.draw_id = p_draw and e.user_id = (select auth.uid()) and e.winner),
    coalesce((
      select jsonb_agg(jsonb_build_object('name', p.name, 'username', p.username, 'avatar', p.avatar_url) order by p.name)
      from public.lucky_draw_entries e join public.profiles p on p.id = e.user_id
      where e.draw_id = p_draw and e.winner
    ), '[]'::jsonb)
  where (select auth.uid()) is not null;
$$;

revoke all on function public.lucky_draw_summary(uuid) from public, anon;
grant execute on function public.lucky_draw_summary(uuid) to authenticated;

-- After a draw closes: pick random winners and give each 3 months of Premium.
create or replace function public.admin_draw_winners(p_draw uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  d public.lucky_draws;
  picked integer;
  w record;
begin
  if not public.has_admin_power('contests') then
    raise exception 'Only admins who manage contests can draw winners' using errcode = '42501';
  end if;
  select * into d from public.lucky_draws where id = p_draw for update;
  if not found then
    raise exception 'Draw not found' using errcode = '22023';
  end if;
  if d.drawn_at is not null then
    raise exception 'Winners have already been drawn' using errcode = '22023';
  end if;
  if now() < d.ends_at then
    raise exception 'This draw is still open' using errcode = '22023';
  end if;

  -- Only active members can win; order by a cryptographically random value.
  update public.lucky_draw_entries e set winner = true
  where e.draw_id = p_draw
    and e.user_id in (
      select x.user_id from public.lucky_draw_entries x
      join public.profiles p on p.id = x.user_id and p.status = 'active'
      where x.draw_id = p_draw
      order by extensions.gen_random_bytes(16)
      limit d.winners_count
    );
  get diagnostics picked = row_count;

  for w in select user_id from public.lucky_draw_entries where draw_id = p_draw and winner loop
    perform public.extend_premium(w.user_id, interval '3 months', 'granted');
  end loop;

  -- Tell the column guard this change comes from here (for this transaction only).
  perform set_config('recipenest.drawing_winners', 'on', true);
  update public.lucky_draws set drawn_at = now() where id = p_draw;
  perform set_config('recipenest.drawing_winners', 'off', true);
  return picked;
end;
$$;

revoke all on function public.admin_draw_winners(uuid) from public, anon;
grant execute on function public.admin_draw_winners(uuid) to authenticated;

-- Admins who run draws: the winners with their emails (to arrange the cash prize).
create or replace function public.admin_draw_winner_details(p_draw uuid)
returns table (user_id uuid, name text, username text, email text, prize_paid boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.has_admin_power('contests') then
    raise exception 'Only admins who manage contests can see this' using errcode = '42501';
  end if;
  return query
    select p.id, p.name, p.username, u.email::text, e.prize_paid
    from public.lucky_draw_entries e
    join public.profiles p on p.id = e.user_id
    join auth.users u on u.id = e.user_id
    where e.draw_id = p_draw and e.winner
    order by p.name;
end;
$$;

revoke all on function public.admin_draw_winner_details(uuid) from public, anon;
grant execute on function public.admin_draw_winner_details(uuid) to authenticated;

-- Owner only: record that a winner's cash prize was paid.
create or replace function public.owner_set_draw_prize_paid(p_draw uuid, p_user uuid, paid boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_owner() then
    raise exception 'Only the site owner can mark prizes as paid' using errcode = '42501';
  end if;
  update public.lucky_draw_entries set prize_paid = paid where draw_id = p_draw and user_id = p_user and winner;
end;
$$;

revoke all on function public.owner_set_draw_prize_paid(uuid, uuid, boolean) from public, anon;
grant execute on function public.owner_set_draw_prize_paid(uuid, uuid, boolean) to authenticated;

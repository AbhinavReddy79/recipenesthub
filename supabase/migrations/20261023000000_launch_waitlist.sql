-- RecipeNest: "Notify me at launch" sign-ups from the countdown page.
-- Run after the earlier migrations. Every statement is idempotent.
--
-- - Anyone can add an email through join_launch_waitlist (no direct table
--   access, so nobody can read the list or learn whether an email is on it).
-- - The owner and admins with the "Members" power see the list, mark it
--   notified after the launch email goes out, and remove people on request.

create table if not exists public.launch_waitlist (
  email text primary key check (char_length(email) between 3 and 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now(),
  notified_at timestamptz
);
create index if not exists launch_waitlist_created_idx on public.launch_waitlist (created_at desc);

alter table public.launch_waitlist enable row level security;
revoke all on public.launch_waitlist from anon, authenticated;
grant select, update, delete on public.launch_waitlist to authenticated;

drop policy if exists "Member admins read the waitlist" on public.launch_waitlist;
create policy "Member admins read the waitlist" on public.launch_waitlist
  for select to authenticated using (public.has_admin_power('members'));
drop policy if exists "Member admins mark the waitlist notified" on public.launch_waitlist;
create policy "Member admins mark the waitlist notified" on public.launch_waitlist
  for update to authenticated using (public.has_admin_power('members')) with check (public.has_admin_power('members'));
drop policy if exists "Member admins remove waitlist emails" on public.launch_waitlist;
create policy "Member admins remove waitlist emails" on public.launch_waitlist
  for delete to authenticated using (public.has_admin_power('members'));

-- Adds an email. Always answers the same way (already on the list or not), and
-- slows down floods: at most 60 new sign-ups a minute across the whole site.
create or replace function public.join_launch_waitlist(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  clean text := lower(btrim(coalesce(p_email, '')));
begin
  if char_length(clean) not between 3 and 254 or clean !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Please enter a valid email address' using errcode = '22023';
  end if;
  if (select count(*) from public.launch_waitlist where created_at > now() - interval '1 minute') >= 60 then
    raise exception 'Too many sign-ups right now. Please try again in a minute.' using errcode = '54000';
  end if;
  insert into public.launch_waitlist (email) values (clean) on conflict (email) do nothing;
end;
$$;

revoke all on function public.join_launch_waitlist(text) from public;
grant execute on function public.join_launch_waitlist(text) to anon, authenticated;

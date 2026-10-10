-- RecipeNest: messages from the public Contact page. Run after the earlier
-- migrations. Every statement is idempotent.
--
-- Anyone (signed in or not) can send a message; only admins can read, mark
-- handled or delete them. Lengths are capped and each email address can send
-- at most 5 messages an hour.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (char_length(email) between 3 and 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  topic text not null default 'general' check (topic in ('general', 'billing', 'refund', 'contest', 'account', 'other')),
  message text not null check (char_length(message) between 10 and 2000),
  user_id uuid references public.profiles (id) on delete set null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from anon, authenticated;
grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;

drop policy if exists "Anyone can send a message" on public.contact_messages;
create policy "Anyone can send a message" on public.contact_messages
  for insert to anon, authenticated
  with check (handled = false and (user_id is null or user_id = (select auth.uid())));

drop policy if exists "Admins read messages" on public.contact_messages;
create policy "Admins read messages" on public.contact_messages
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins mark messages handled" on public.contact_messages;
create policy "Admins mark messages handled" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins delete messages" on public.contact_messages;
create policy "Admins delete messages" on public.contact_messages
  for delete to authenticated using (public.is_admin());

-- At most 5 messages per email address per hour (helper from the security migration).
drop trigger if exists contact_messages_rate on public.contact_messages;
create trigger contact_messages_rate before insert on public.contact_messages
  for each row execute function public.enforce_hourly_rate('email', '5', 'id');

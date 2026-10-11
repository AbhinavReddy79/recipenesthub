-- RecipeNest: reply to Contact messages from the admin dashboard.
-- Run after the earlier migrations. Every statement is idempotent.
--
-- - Admins with the "Messages" power reply inside Admin -> Messages.
-- - If the sender was signed in, they read the replies (and answer back) on
--   their "Support messages" page. Guests are answered by email from the
--   admin's own mail app, with the reply text filled in.
-- - An admin reply marks the message handled; a member's answer reopens it.

create table if not exists public.contact_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.contact_messages (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  from_admin boolean not null,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists contact_replies_message_idx on public.contact_replies (message_id, created_at);

-- When the sender last opened the conversation (for the "new reply" badge).
alter table public.contact_messages add column if not exists user_read_at timestamptz;

alter table public.contact_replies enable row level security;
revoke all on public.contact_replies from anon, authenticated;
grant select, insert on public.contact_replies to authenticated;

-- Senders who were signed in can read their own messages.
drop policy if exists "Members read their own messages" on public.contact_messages;
create policy "Members read their own messages" on public.contact_messages
  for select to authenticated using (user_id is not null and user_id = (select auth.uid()));

create or replace function public.owns_contact_message(p_message uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.contact_messages
    where id = p_message and user_id is not null and user_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_contact_message(uuid) from public, anon;
grant execute on function public.owns_contact_message(uuid) to authenticated;

drop policy if exists "Admins and the sender read replies" on public.contact_replies;
create policy "Admins and the sender read replies" on public.contact_replies
  for select to authenticated
  using (public.has_admin_power('messages') or public.owns_contact_message(message_id));

drop policy if exists "Admins and the sender reply" on public.contact_replies;
create policy "Admins and the sender reply" on public.contact_replies
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_active_user()
    and (
      (from_admin and public.has_admin_power('messages'))
      or (not from_admin and public.owns_contact_message(message_id))
    )
  );

drop trigger if exists contact_replies_rate on public.contact_replies;
create trigger contact_replies_rate before insert on public.contact_replies
  for each row execute function public.enforce_hourly_rate('author_id', '30', 'id');

-- An admin reply marks the message handled; a reply from the sender reopens it.
create or replace function public.contact_reply_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.contact_messages
  set handled = new.from_admin,
      user_read_at = case when new.from_admin then user_read_at else now() end
  where id = new.message_id;
  return new;
end;
$$;

revoke execute on function public.contact_reply_status() from public, anon, authenticated;

drop trigger if exists contact_replies_status on public.contact_replies;
create trigger contact_replies_status after insert on public.contact_replies
  for each row execute function public.contact_reply_status();

-- The sender opened the conversation.
create or replace function public.mark_contact_message_read(p_message uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.contact_messages set user_read_at = now()
  where id = p_message and user_id is not null and user_id = (select auth.uid());
$$;

revoke all on function public.mark_contact_message_read(uuid) from public, anon;
grant execute on function public.mark_contact_message_read(uuid) to authenticated;

-- How many of my conversations have an admin reply I haven't seen.
create or replace function public.my_unread_support_replies()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.contact_messages m
  where m.user_id is not null and m.user_id = (select auth.uid())
    and exists (
      select 1 from public.contact_replies r
      where r.message_id = m.id and r.from_admin
        and r.created_at > coalesce(m.user_read_at, '-infinity'::timestamptz)
    );
$$;

revoke all on function public.my_unread_support_replies() from public, anon;
grant execute on function public.my_unread_support_replies() to authenticated;

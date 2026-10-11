-- RecipeNest: schedule invitation emails from the admin dashboard.
-- Run after the earlier migrations. Every statement is idempotent.
--
-- - Admins with the "Members" power (and the owner) schedule an email for a
--   date and time, to the launch waitlist or to specific addresses (up to 25).
-- - Every minute pg_cron checks for due emails. If there is one, it calls the
--   send-launch-email Edge Function with a single-use code it just created, so
--   no secret key has to be stored anywhere. The function checks the code,
--   claims the email and sends it (the waitlist in batches, minute by minute).

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.scheduled_emails (
  id uuid primary key default gen_random_uuid(),
  subject text not null check (char_length(subject) between 3 and 150),
  message text not null check (char_length(message) between 10 and 4000),
  audience text not null check (audience in ('waitlist', 'direct')),
  emails text[] not null default '{}',
  send_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'sending', 'sent', 'failed', 'cancelled')),
  sent_count integer not null default 0,
  failed_emails text[] not null default '{}',
  error text,
  claimed_at timestamptz,
  finished_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (audience = 'waitlist' and cardinality(emails) = 0)
    or (audience = 'direct' and cardinality(emails) between 1 and 25)
  )
);
create index if not exists scheduled_emails_due_idx on public.scheduled_emails (status, send_at);

alter table public.scheduled_emails enable row level security;
revoke all on public.scheduled_emails from anon, authenticated;
grant select, insert, delete on public.scheduled_emails to authenticated;

drop policy if exists "Member admins see scheduled emails" on public.scheduled_emails;
create policy "Member admins see scheduled emails" on public.scheduled_emails
  for select to authenticated using (public.has_admin_power('members'));
drop policy if exists "Member admins schedule emails" on public.scheduled_emails;
create policy "Member admins schedule emails" on public.scheduled_emails
  for insert to authenticated
  with check (
    public.has_admin_power('members')
    and created_by = (select auth.uid())
    and status = 'scheduled' and sent_count = 0 and claimed_at is null and finished_at is null
    and send_at > now() - interval '5 minutes'
  );
-- Finished or cancelled emails can be cleared from the list (one that is sending can't).
drop policy if exists "Member admins clear finished emails" on public.scheduled_emails;
create policy "Member admins clear finished emails" on public.scheduled_emails
  for delete to authenticated
  using (public.has_admin_power('members') and status in ('sent', 'failed', 'cancelled'));

-- Cancel an email that hasn't started sending.
create or replace function public.cancel_scheduled_email(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_admin_power('members') then
    raise exception 'Only admins who manage members can do this' using errcode = '42501';
  end if;
  update public.scheduled_emails set status = 'cancelled', finished_at = now()
  where id = p_id and status = 'scheduled';
  return found;
end;
$$;

revoke all on function public.cancel_scheduled_email(uuid) from public, anon;
grant execute on function public.cancel_scheduled_email(uuid) to authenticated;

-- Single-use codes that let the minute timer call the Edge Function.
create table if not exists public.email_runner_nonces (
  nonce text primary key,
  created_at timestamptz not null default now()
);
alter table public.email_runner_nonces enable row level security;
revoke all on public.email_runner_nonces from anon, authenticated;

-- Used by the Edge Function (service role): checks and burns a code.
create or replace function public.use_email_runner_nonce(p_nonce text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  with used as (
    delete from public.email_runner_nonces
    where nonce = p_nonce and created_at > now() - interval '3 minutes'
    returning 1
  )
  select exists (select 1 from used);
$$;

revoke all on function public.use_email_runner_nonce(text) from public, anon, authenticated;
grant execute on function public.use_email_runner_nonce(text) to service_role;

-- Used by the Edge Function (service role): takes the next due email, so two
-- runs never send the same one. A run that died mid-way is retried after 3 minutes.
create or replace function public.claim_scheduled_email()
returns setof public.scheduled_emails
language sql
security definer
set search_path = ''
as $$
  update public.scheduled_emails s
  set status = 'sending', claimed_at = now()
  where s.id = (
    select id from public.scheduled_emails
    where (status = 'scheduled' and send_at <= now())
       or (status = 'sending' and claimed_at < now() - interval '3 minutes')
    order by send_at
    limit 1
    for update skip locked
  )
  returning s.*;
$$;

revoke all on function public.claim_scheduled_email() from public, anon, authenticated;
grant execute on function public.claim_scheduled_email() to service_role;

-- The minute timer: only calls the Edge Function when an email is due.
create or replace function public.run_scheduled_emails()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  code text;
begin
  delete from public.email_runner_nonces where created_at < now() - interval '10 minutes';
  if not exists (
    select 1 from public.scheduled_emails
    where (status = 'scheduled' and send_at <= now())
       or (status = 'sending' and claimed_at < now() - interval '3 minutes')
  ) then
    return;
  end if;
  code := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.email_runner_nonces (nonce) values (code);
  perform net.http_post(
    url := 'https://fadfgxkbefeqxjlsdkyt.supabase.co/functions/v1/send-launch-email',
    body := jsonb_build_object('mode', 'scheduled', 'nonce', code),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 120000
  );
end;
$$;

revoke all on function public.run_scheduled_emails() from public, anon, authenticated;

select cron.schedule('recipenest-scheduled-emails', '* * * * *', 'select public.run_scheduled_emails()');

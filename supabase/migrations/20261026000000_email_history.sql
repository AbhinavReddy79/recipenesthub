-- RecipeNest: a full history of invitation emails in the admin dashboard.
-- Run after the earlier migrations. Every statement is idempotent.
--
-- - sent_to: every address an email actually reached (for the waitlist too).
-- - kind: "scheduled" (picked a time) or "instant" (Send now). Instant sends
--   are recorded by the send-launch-email function, so every invitation that
--   went out shows up in the same list.

alter table public.scheduled_emails add column if not exists sent_to text[] not null default '{}';
alter table public.scheduled_emails add column if not exists kind text not null default 'scheduled';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'scheduled_emails_kind_check') then
    alter table public.scheduled_emails add constraint scheduled_emails_kind_check check (kind in ('scheduled', 'instant'));
  end if;
end;
$$;

-- Admins only create scheduled rows themselves; instant rows come from the function.
drop policy if exists "Member admins schedule emails" on public.scheduled_emails;
create policy "Member admins schedule emails" on public.scheduled_emails
  for insert to authenticated
  with check (
    public.has_admin_power('members')
    and created_by = (select auth.uid())
    and kind = 'scheduled'
    and status = 'scheduled' and sent_count = 0 and cardinality(sent_to) = 0
    and claimed_at is null and finished_at is null
    and send_at > now() - interval '5 minutes'
  );

-- The timer only picks up scheduled rows (instant rows are already finished).
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
    where kind = 'scheduled'
      and ((status = 'scheduled' and send_at <= now())
        or (status = 'sending' and claimed_at < now() - interval '3 minutes'))
    order by send_at
    limit 1
    for update skip locked
  )
  returning s.*;
$$;

revoke all on function public.claim_scheduled_email() from public, anon, authenticated;
grant execute on function public.claim_scheduled_email() to service_role;

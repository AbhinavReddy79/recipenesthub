-- Owner-only launch email and email history:
-- * Admins with the "Members" power can still send, schedule, edit and cancel
--   pre-launch teasers. Only the owner can schedule, edit or cancel the launch
--   invitation (the Edge Function checks "Send now" the same way).
-- * Only the owner can remove entries from the invitation email history, so a
--   scheduled launch email can't disappear because of another admin.

drop policy if exists "Member admins schedule emails" on public.scheduled_emails;
create policy "Member admins schedule emails" on public.scheduled_emails
  for insert to authenticated
  with check (
    public.has_admin_power('members')
    and (variant = 'teaser' or public.is_owner())
    and created_by = (select auth.uid())
    and kind = 'scheduled'
    and status = 'scheduled' and sent_count = 0 and cardinality(sent_to) = 0
    and claimed_at is null and finished_at is null
    and send_at > now() - interval '5 minutes'
  );

drop policy if exists "Member admins clear finished emails" on public.scheduled_emails;
drop policy if exists "Owner clears finished emails" on public.scheduled_emails;
create policy "Owner clears finished emails" on public.scheduled_emails
  for delete to authenticated
  using (public.is_owner() and status in ('sent', 'failed', 'cancelled'));

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
  if not public.is_owner() and exists (select 1 from public.scheduled_emails where id = p_id and variant = 'launch') then
    raise exception 'Only the owner can cancel the launch email' using errcode = '42501';
  end if;
  update public.scheduled_emails set status = 'cancelled', finished_at = now()
  where id = p_id and status = 'scheduled';
  return found;
end;
$$;

revoke all on function public.cancel_scheduled_email(uuid) from public, anon;
grant execute on function public.cancel_scheduled_email(uuid) to authenticated;

create or replace function public.update_scheduled_email(
  p_id uuid,
  p_subject text,
  p_message text,
  p_variant text,
  p_audience text,
  p_emails text[],
  p_send_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.has_admin_power('members') then
    raise exception 'Only admins who manage members can do this' using errcode = '42501';
  end if;
  if not public.is_owner()
     and (p_variant = 'launch' or exists (select 1 from public.scheduled_emails where id = p_id and variant = 'launch')) then
    raise exception 'Only the owner can change the launch email' using errcode = '42501';
  end if;
  if p_send_at < now() + interval '1 minute' then
    raise exception 'Pick a time at least a minute from now' using errcode = '22023';
  end if;
  -- The table's own checks still apply: subject/message length, variant, audience and up to 25 addresses.
  update public.scheduled_emails
     set subject = btrim(p_subject),
         message = btrim(p_message),
         variant = p_variant,
         audience = p_audience,
         emails = case when p_audience = 'direct' then coalesce(p_emails, '{}') else '{}' end,
         send_at = p_send_at
   where id = p_id
     and kind = 'scheduled'
     and status = 'scheduled'
     and sent_count = 0
     and claimed_at is null;
  return found;
end;
$$;

revoke all on function public.update_scheduled_email(uuid, text, text, text, text, text[], timestamptz) from public, anon;
grant execute on function public.update_scheduled_email(uuid, text, text, text, text, text[], timestamptz) to authenticated;

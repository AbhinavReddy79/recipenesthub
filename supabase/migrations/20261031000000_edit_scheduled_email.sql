-- Edit a scheduled invitation email (type, recipients, time, subject, message)
-- until the minute timer picks it up. Only rows still waiting can change, so an
-- email that has started sending can't be altered halfway through.

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

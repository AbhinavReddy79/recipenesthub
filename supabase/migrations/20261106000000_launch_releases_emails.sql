-- Pressing "Launch RecipeNest" also releases every scheduled launch-invitation
-- email straight away (send time = now), so the "Join RecipeNest" button is
-- live the moment the emails arrive. The minute timer sends them within about
-- a minute, 25 addresses per run. Teasers and emails already sending are untouched.

create or replace function public.owner_set_launched(launched boolean)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  result timestamptz;
begin
  if not public.is_owner() then
    raise exception 'Only the site owner can launch the site' using errcode = '42501';
  end if;
  update public.site_status
    set launched_at = case when launched then coalesce(launched_at, now()) else null end,
        launched_by = case when launched then (select auth.uid()) else null end
    where id
    returning launched_at into result;
  if launched then
    update public.scheduled_emails
       set send_at = now()
     where kind = 'scheduled'
       and variant = 'launch'
       and status = 'scheduled'
       and sent_count = 0
       and claimed_at is null
       and send_at > now();
  end if;
  return result;
end;
$$;

revoke all on function public.owner_set_launched(boolean) from public, anon;
grant execute on function public.owner_set_launched(boolean) to authenticated;

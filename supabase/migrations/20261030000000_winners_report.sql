-- Winners report for the owner's email: after a contest is announced or a lucky
-- draw is drawn, the send-launch-email function (service role) reads the winners'
-- names, emails and recipes plus the owner's email, and emails them to the owner.
-- Only the service role can call this: it reads auth.users emails.

create or replace function public.winners_report(p_kind text, p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  owner_email text;
  result jsonb;
begin
  select u.email into owner_email
  from public.app_owner o
  join auth.users u on u.id = o.user_id
  limit 1;

  if p_kind = 'contest' then
    select jsonb_build_object(
      'title', c.title,
      'prize', c.prize_amount,
      'ends_at', c.ends_at,
      'done_at', c.announced_at,
      'winners', coalesce((
        select jsonb_agg(jsonb_build_object(
          'place', w.place,
          'recipe', r.title,
          'slug', r.slug,
          'name', p.name,
          'username', p.username,
          'email', u.email,
          'votes', (select count(*) from public.contest_votes v where v.entry_id = e.id)
        ) order by w.place)
        from (values (1, c.winner_entry_id), (2, c.runner_up_entry_id)) as w(place, entry_id)
        join public.contest_entries e on e.id = w.entry_id
        join public.recipes r on r.id = e.recipe_id
        join public.profiles p on p.id = e.user_id
        join auth.users u on u.id = e.user_id
      ), '[]'::jsonb)
    ) into result
    from public.contests c
    where c.id = p_id;
  elsif p_kind = 'draw' then
    select jsonb_build_object(
      'title', d.title,
      'prize', d.cash_prize,
      'ends_at', d.ends_at,
      'done_at', d.drawn_at,
      'winners', coalesce((
        select jsonb_agg(jsonb_build_object('name', p.name, 'username', p.username, 'email', u.email) order by p.name)
        from public.lucky_draw_entries le
        join public.profiles p on p.id = le.user_id
        join auth.users u on u.id = le.user_id
        where le.draw_id = d.id and le.winner
      ), '[]'::jsonb)
    ) into result
    from public.lucky_draws d
    where d.id = p_id;
  else
    raise exception 'Unknown kind' using errcode = '22023';
  end if;

  if result is null then
    return null;
  end if;
  return result || jsonb_build_object('owner_email', owner_email);
end;
$$;

revoke all on function public.winners_report(text, uuid) from public, anon, authenticated;
grant execute on function public.winners_report(text, uuid) to service_role;

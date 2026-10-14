-- Contests can have 1 or 2 winners. prize_amount is the cash prize for EACH winner.
-- The winner is the most-voted entry; the runner-up is second. Both get a free Premium month.

alter table public.contests
  add column if not exists winner_count smallint not null default 1,
  add column if not exists runner_up_entry_id uuid;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contests_winner_count_check') then
    alter table public.contests
      add constraint contests_winner_count_check check (winner_count between 1 and 2);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'contests_runner_up_entry_fkey') then
    alter table public.contests
      add constraint contests_runner_up_entry_fkey foreign key (runner_up_entry_id)
      references public.contest_entries (id) on delete set null;
  end if;
end;
$$;

create or replace function public.admin_announce_winner(p_contest uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.contests;
  top_ids uuid[] := '{}';
  pick record;
begin
  if not public.has_admin_power('contests') then
    raise exception 'Only admins who manage contests can announce winners' using errcode = '42501';
  end if;
  select * into c from public.contests where id = p_contest for update;
  if not found then
    raise exception 'Contest not found' using errcode = '22023';
  end if;
  if c.announced_at is not null then
    raise exception 'The winner has already been announced' using errcode = '22023';
  end if;
  if now() < c.ends_at then
    raise exception 'This contest is still running' using errcode = '22023';
  end if;

  -- One entry per member per contest, so the winners are always different people.
  for pick in
    select e.id, e.user_id
    from public.contest_entries e
    join public.recipes r on r.id = e.recipe_id and r.status = 'published'
    left join public.contest_votes v on v.entry_id = e.id
    where e.contest_id = p_contest
    group by e.id, e.user_id, e.created_at
    order by count(v.user_id) desc, e.created_at asc
    limit c.winner_count
  loop
    top_ids := top_ids || pick.id;
    perform public.extend_premium(pick.user_id, interval '1 month', 'granted');
  end loop;

  update public.contests
     set winner_entry_id = top_ids[1], runner_up_entry_id = top_ids[2], announced_at = now()
   where id = p_contest;
  return top_ids[1];
end;
$$;

revoke all on function public.admin_announce_winner(uuid) from public, anon;
grant execute on function public.admin_announce_winner(uuid) to authenticated;

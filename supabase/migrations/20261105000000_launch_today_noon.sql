-- Launch moved to today, Tuesday 20 October 2026 at 12:00 pm India time: the first
-- contest and lucky draw open at launch and close Tue 27 Oct 11:59 pm.

update public.contests
   set starts_at = '2026-10-20 12:00:00+05:30',
       ends_at   = '2026-10-27 23:59:00+05:30'
 where title = 'Your Favourite Telugu Dish'
   and announced_at is null;

update public.lucky_draws
   set starts_at = '2026-10-20 12:00:00+05:30',
       ends_at   = '2026-10-27 23:59:00+05:30'
 where title = 'Launch Week Lucky Draw'
   and drawn_at is null;

select 'contest' as kind, title, starts_at at time zone 'Asia/Kolkata' as starts_ist, ends_at at time zone 'Asia/Kolkata' as ends_ist
  from public.contests where title = 'Your Favourite Telugu Dish'
union all
select 'lucky draw', title, starts_at at time zone 'Asia/Kolkata', ends_at at time zone 'Asia/Kolkata'
  from public.lucky_draws where title = 'Launch Week Lucky Draw';

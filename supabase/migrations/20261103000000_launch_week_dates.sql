-- Launch moved to Wednesday 21 October 2026: the first contest and lucky draw
-- start on launch day and run a full week (21 Oct 00:00 – 27 Oct 23:59, India time).
-- Only rows that haven't been announced / drawn yet are touched.

update public.contests
   set starts_at = '2026-10-21 00:00:00+05:30',
       ends_at   = '2026-10-27 23:59:00+05:30'
 where title = 'Your Favourite Telugu Dish'
   and announced_at is null;

update public.lucky_draws
   set starts_at = '2026-10-21 00:00:00+05:30',
       ends_at   = '2026-10-27 23:59:00+05:30'
 where title = 'Launch Week Lucky Draw'
   and drawn_at is null;

select 'contest' as kind, title, starts_at at time zone 'Asia/Kolkata' as starts_ist, ends_at at time zone 'Asia/Kolkata' as ends_ist
  from public.contests where title = 'Your Favourite Telugu Dish'
union all
select 'lucky draw', title, starts_at at time zone 'Asia/Kolkata', ends_at at time zone 'Asia/Kolkata'
  from public.lucky_draws where title = 'Launch Week Lucky Draw';

-- Everyone who already received a pre-launch teaser at a typed-in address goes on
-- the launch waitlist (marked as teased), so the launch email reaches them at
-- launch. From now on the send-launch-email function does this as each teaser goes out.
-- People already on the list keep their sign-up date and status.

insert into public.launch_waitlist (email, teased_at)
select distinct lower(btrim(addr)), coalesce(s.finished_at, s.send_at)
from public.scheduled_emails s
cross join lateral unnest(s.sent_to) as addr
where s.variant = 'teaser'
  and s.audience = 'direct'
  and lower(btrim(addr)) ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
on conflict (email) do update
  set teased_at = coalesce(public.launch_waitlist.teased_at, excluded.teased_at);

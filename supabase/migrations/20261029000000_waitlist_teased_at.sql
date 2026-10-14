-- Teasers and the launch email are tracked separately on the waitlist:
-- teased_at = got a pre-launch teaser, notified_at = got the launch email.
-- Before this, a teaser set notified_at, so teased people would have been skipped at launch.

alter table public.launch_waitlist add column if not exists teased_at timestamptz;

-- Nobody has had the real launch email yet (the site isn't open), so everyone gets it at launch.
update public.launch_waitlist set notified_at = null where notified_at is not null;

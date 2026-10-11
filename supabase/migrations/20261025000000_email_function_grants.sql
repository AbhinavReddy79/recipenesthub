-- RecipeNest: let the send-launch-email Edge Function (service role) read and
-- update the email tables. This project doesn't grant new tables to
-- service_role automatically, so without this the function could send mail but
-- not record it (scheduled emails stayed "sending" and would be retried, and
-- waitlist people weren't marked as emailed).
-- Run after the earlier migrations. Every statement is idempotent.

grant select, insert, update, delete on public.launch_waitlist to service_role;
grant select, insert, update, delete on public.scheduled_emails to service_role;
grant select, insert, update, delete on public.email_runner_nonces to service_role;

-- A direct invitation that was sent but couldn't be marked (the function
-- reported it sent before this fix): record it as sent so it isn't resent.
update public.scheduled_emails
set status = 'sent', sent_count = greatest(sent_count, cardinality(emails)), finished_at = coalesce(finished_at, now())
where status = 'sending' and audience = 'direct' and sent_count = 0;

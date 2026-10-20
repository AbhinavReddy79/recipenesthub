-- Scheduled invitation emails to typed-in addresses: up to 100 addresses (was 25).
-- The send-launch-email function sends them 25 per minute-run, carrying on until done.

do $$
declare
  c text;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.scheduled_emails'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%cardinality(emails)%'
  loop
    execute format('alter table public.scheduled_emails drop constraint %I', c);
  end loop;
end;
$$;

alter table public.scheduled_emails
  add constraint scheduled_emails_recipients_check check (
    (audience = 'waitlist' and cardinality(emails) = 0)
    or (audience = 'direct' and cardinality(emails) between 1 and 100)
  );

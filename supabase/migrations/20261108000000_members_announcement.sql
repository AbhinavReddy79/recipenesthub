-- A third invitation-email type: "members", an announcement to people who
-- already have an account (button "Open RecipeNest"). Sent from the dashboard to
-- every member's address, a group at a time; it never touches the waitlist.

alter table public.scheduled_emails drop constraint if exists scheduled_emails_variant_check;
alter table public.scheduled_emails
  add constraint scheduled_emails_variant_check check (variant in ('launch', 'teaser', 'members'));

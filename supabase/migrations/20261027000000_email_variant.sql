-- RecipeNest: invitation emails come in two types.
-- Run after the earlier migrations. Every statement is idempotent.
--
-- - launch: "Join RecipeNest" button to the sign-up page (from launch day).
-- - teaser: "Get notified at launch" button to the countdown page's Notify me
--   box, with a footer for people who never signed up (before launch).

alter table public.scheduled_emails add column if not exists variant text not null default 'launch';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'scheduled_emails_variant_check') then
    alter table public.scheduled_emails add constraint scheduled_emails_variant_check check (variant in ('launch', 'teaser'));
  end if;
end;
$$;

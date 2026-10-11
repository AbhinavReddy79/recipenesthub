-- RecipeNest: every new member starts with 1 month of Premium, free.
-- Run after the earlier migrations. Every statement is idempotent.
--
-- Profiles are created once per account (by handle_new_user on sign-up or
-- invite), so each new account gets the welcome month exactly once. Existing
-- members are not changed.

create or replace function public.grant_welcome_premium()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.extend_premium(new.id, interval '1 month', 'granted');
  return new;
end;
$$;

revoke execute on function public.grant_welcome_premium() from public, anon, authenticated;

drop trigger if exists profiles_welcome_premium on public.profiles;
create trigger profiles_welcome_premium
  after insert on public.profiles
  for each row execute function public.grant_welcome_premium();

-- RecipeNest: remove the early-access feature (before launch only the owner
-- gets past the countdown again). Run after the earlier migrations; safe to re-run.
-- The early_access table was empty when this was written.

drop function if exists public.admin_list_early_access();
drop function if exists public.set_early_access(uuid, boolean);
drop function if exists public.has_site_access();
drop table if exists public.early_access;

-- RecipeNest: admins can moderate (edit or delete) reviews. Run after the earlier migrations.
-- Every statement is idempotent.

-- When an admin edits someone else's review, it's marked so readers can see it was moderated.
alter table public.reviews add column if not exists moderated_at timestamptz;

-- A review always stays attached to its recipe and author; moderation is stamped automatically.
create or replace function public.guard_review_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.recipe_slug is distinct from old.recipe_slug
     or new.author_id is distinct from old.author_id
     or new.created_at is distinct from old.created_at then
    raise exception 'A review''s recipe, author and date cannot be changed' using errcode = '42501';
  end if;
  if (select auth.uid()) is null then
    return new; -- SQL Editor
  end if;
  if old.author_id = (select auth.uid()) then
    new.moderated_at := old.moderated_at; -- authors can't set or clear the moderation mark
  else
    new.moderated_at := now();
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_review_columns() from public, anon, authenticated;

drop trigger if exists reviews_guard_columns on public.reviews;
create trigger reviews_guard_columns
  before update on public.reviews
  for each row execute function public.guard_review_columns();

-- Admins may edit any review except the owner's (only the owner moderates their own).
drop policy if exists "Admins moderate reviews" on public.reviews;
create policy "Admins moderate reviews"
  on public.reviews for update to authenticated
  using (public.is_admin() and (public.is_owner() or not public.is_owner(author_id)))
  with check (public.is_admin() and (public.is_owner() or not public.is_owner(author_id)));

-- Same rule for deleting.
drop policy if exists "Authors and admins delete reviews" on public.reviews;
create policy "Authors and admins delete reviews"
  on public.reviews for delete to authenticated
  using (
    author_id = (select auth.uid())
    or (public.is_admin() and (public.is_owner() or not public.is_owner(author_id)))
  );

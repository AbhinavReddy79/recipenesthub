-- Launch day: the owner keeps every power. Every other admin keeps
-- "Moderate recipes & reviews" and "Contact messages & replies" only, so members,
-- invitations, contests and lucky draws stay with the owner. Admins who currently
-- have no powers at all are left as they are. Change it any time in Admin > Users.

insert into public.admin_permissions as a (user_id, moderate, members, contests, messages, updated_at)
select p.id, true, false, false, true, now()
from public.profiles p
left join public.admin_permissions cur on cur.user_id = p.id
where p.role = 'admin'
  and not exists (select 1 from public.app_owner o where o.user_id = p.id)
  and (cur.user_id is null or cur.moderate or cur.members or cur.contests or cur.messages)
on conflict (user_id) do update
  set moderate = excluded.moderate,
      members = excluded.members,
      contests = excluded.contests,
      messages = excluded.messages,
      updated_at = excluded.updated_at;

select p.name, p.username,
       coalesce(a.moderate, true) as moderate, coalesce(a.members, false) as members,
       coalesce(a.contests, false) as contests, coalesce(a.messages, false) as messages
from public.profiles p
left join public.admin_permissions a on a.user_id = p.id
where p.role = 'admin'
  and not exists (select 1 from public.app_owner o where o.user_id = p.id)
order by p.name;

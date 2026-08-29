create function private.has_aal2()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;

create function public.get_my_membership_statuses()
returns setof public.organization_member_status
language sql
stable
security definer
set search_path = ''
as $$
  select membership.status
  from public.organization_members as membership
  where membership.user_id = (select auth.uid());
$$;

alter policy "active members read their organizations"
on public.organizations
using (
  (select private.has_aal2())
  and (select private.is_active_organization_member(id))
);

alter policy "active members read memberships in their organizations"
on public.organization_members
using (
  (select private.has_aal2())
  and (select private.is_active_organization_member(organization_id))
);

revoke all on function private.has_aal2()
from public, anon, authenticated, service_role;

revoke all on function public.get_my_membership_statuses()
from public, anon, authenticated, service_role;

grant execute on function private.has_aal2() to authenticated;
grant execute on function public.get_my_membership_statuses() to authenticated;

create function public.accept_my_organization_invitation()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  membership_count integer;
  invited_membership_id uuid;
  invited_organization_id uuid;
  invited_status public.organization_member_status;
begin
  if current_user_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'Invitation cannot be accepted.';
  end if;

  perform 1
  from public.organization_members as membership
  where membership.user_id = current_user_id
  for update;

  select count(*)::integer
  into membership_count
  from public.organization_members as membership
  where membership.user_id = current_user_id;

  if membership_count <> 1 then
    raise exception using
      errcode = 'P0001',
      message = 'Invitation cannot be accepted.';
  end if;

  select membership.id, membership.organization_id, membership.status
  into invited_membership_id, invited_organization_id, invited_status
  from public.organization_members as membership
  where membership.user_id = current_user_id;

  if invited_status <> 'invited' then
    raise exception using
      errcode = 'P0001',
      message = 'Invitation cannot be accepted.';
  end if;

  update public.organization_members
  set status = 'active'
  where id = invited_membership_id
    and status = 'invited';

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'Invitation cannot be accepted.';
  end if;

  return invited_organization_id;
end;
$$;

revoke all on function public.accept_my_organization_invitation()
from public, anon, authenticated, service_role;

grant execute on function public.accept_my_organization_invitation()
to authenticated;

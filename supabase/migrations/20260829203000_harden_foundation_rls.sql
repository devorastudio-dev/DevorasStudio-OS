create function private.has_active_membership()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as membership
    where membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

revoke all on function private.has_active_membership()
from public, anon, authenticated, service_role;
grant execute on function private.has_active_membership() to authenticated;

alter policy "authenticated users read own profile"
on public.profiles
using (
  (select auth.uid()) = id
  and (select private.has_aal2())
  and (select private.has_active_membership())
);

alter policy "authenticated users update own profile"
on public.profiles
using (
  (select auth.uid()) = id
  and (select private.has_aal2())
  and (select private.has_active_membership())
)
with check (
  (select auth.uid()) = id
  and (select private.has_aal2())
  and (select private.has_active_membership())
);

create or replace function public.record_audit_event(
  event_action text,
  event_outcome text,
  event_entity_type text default null,
  event_entity_id uuid default null,
  event_metadata jsonb default '{}'::jsonb,
  event_request_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  resolved_organization_id uuid;
  new_id uuid;
begin
  event_metadata := coalesce(event_metadata, '{}'::jsonb);

  if jsonb_typeof(event_metadata) <> 'object'
    or event_metadata - 'capability' - 'mode' - 'role' - 'source' <> '{}'::jsonb then
    raise exception using errcode = 'P0001', message = 'Audit event not permitted.';
  end if;

  if current_user_id is null then
    if not (
      (event_action = 'auth.login.failed' and event_outcome = 'failure')
      or (event_action = 'auth.password_reset.requested' and event_outcome = 'success')
    ) then
      raise exception using errcode = 'P0001', message = 'Audit event not permitted.';
    end if;
  elsif not (
    (event_action = 'auth.login.succeeded' and event_outcome = 'success')
    or (event_action = 'auth.logout.succeeded' and event_outcome = 'success')
    or (event_action = 'auth.password_reset.completed' and event_outcome = 'success')
    or (event_action = 'auth.invitation.accepted' and event_outcome = 'success')
    or (event_action like 'auth.mfa.%' and event_outcome in ('success', 'failure'))
    or (event_action = 'auth.access.denied' and event_outcome = 'denied')
    or (event_action = 'permission.assignment.denied' and event_outcome = 'denied')
  ) then
    raise exception using errcode = 'P0001', message = 'Audit event not permitted.';
  end if;

  if event_entity_type is not null
    and event_entity_type not in ('user', 'organization_member', 'mfa_factor') then
    raise exception using errcode = 'P0001', message = 'Audit event not permitted.';
  end if;

  if current_user_id is not null then
    select membership.organization_id
    into resolved_organization_id
    from public.organization_members as membership
    where membership.user_id = current_user_id
      and membership.status = 'active'
    limit 1;
  end if;

  insert into public.audit_logs (
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    outcome,
    metadata,
    request_id
  ) values (
    resolved_organization_id,
    current_user_id,
    event_action,
    event_entity_type,
    event_entity_id,
    event_outcome,
    event_metadata,
    event_request_id
  ) returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.record_audit_event(text, text, text, uuid, jsonb, uuid)
from public, anon, authenticated, service_role;
grant execute on function public.record_audit_event(text, text, text, uuid, jsonb, uuid)
to anon, authenticated;

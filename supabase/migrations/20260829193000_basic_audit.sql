create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id) on delete restrict,
  actor_user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  outcome text not null,
  metadata jsonb not null default '{}'::jsonb,
  request_id uuid,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_format check (action ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,3}$'),
  constraint audit_logs_action_catalog check (action = any (array[
    'auth.login.succeeded','auth.login.failed','auth.logout.succeeded',
    'auth.password_reset.requested','auth.password_reset.completed',
    'auth.invitation.created','auth.invitation.accepted','auth.invitation.failed',
    'auth.mfa.enrollment_started','auth.mfa.enrollment_completed',
    'auth.mfa.challenge.succeeded','auth.mfa.challenge.failed',
    'auth.mfa.factor_added','auth.mfa.factor_removed','auth.access.denied',
    'member.invited','member.activated','member.suspended','member.reactivated',
    'member.role.assigned','member.role.removed','permission.assignment.denied',
    'administrator.bootstrap.completed'
  ])),
  constraint audit_logs_outcome check (outcome in ('success','failure','denied')),
  constraint audit_logs_entity_type check (entity_type is null or entity_type ~ '^[a-z][a-z0-9_]{0,62}$'),
  constraint audit_logs_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint audit_logs_metadata_size check (pg_column_size(metadata) <= 4096),
  constraint audit_logs_metadata_sensitive check (metadata::text !~* '"(password|code|token|secret|cookie|email|totp|session)"\s*:')
);

create index audit_logs_organization_created_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_actor_created_idx on public.audit_logs (actor_user_id, created_at desc);
create index audit_logs_action_created_idx on public.audit_logs (action, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (organization_id, entity_type, entity_id) where entity_type is not null;

alter table public.audit_logs enable row level security;
create policy "authorized members read organization audit" on public.audit_logs
for select to authenticated
using (
  organization_id is not null
  and (select private.has_permission('audit.read', organization_id))
);

revoke all on table public.audit_logs from public, anon, authenticated;
grant select on table public.audit_logs to authenticated;

create function public.record_audit_event(
  event_action text,
  event_outcome text,
  event_entity_type text default null,
  event_entity_id uuid default null,
  event_metadata jsonb default '{}'::jsonb,
  event_request_id uuid default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  resolved_organization_id uuid;
  new_id uuid;
begin
  if current_user_id is null and event_action not in ('auth.login.failed','auth.password_reset.requested') then
    raise exception using errcode = 'P0001', message = 'Audit event not permitted.';
  end if;
  if current_user_id is not null then
    select membership.organization_id into resolved_organization_id
    from public.organization_members membership
    where membership.user_id = current_user_id and membership.status = 'active'
    limit 2;
  end if;
  insert into public.audit_logs (
    organization_id, actor_user_id, action, entity_type, entity_id, outcome, metadata, request_id
  ) values (
    resolved_organization_id, current_user_id, event_action, event_entity_type,
    event_entity_id, event_outcome, coalesce(event_metadata, '{}'::jsonb), event_request_id
  ) returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.record_audit_event(text,text,text,uuid,jsonb,uuid) from public, anon, authenticated, service_role;
grant execute on function public.record_audit_event(text,text,text,uuid,jsonb,uuid) to anon, authenticated;

create function public.record_administrative_audit(
  target_organization_id uuid,
  event_action text,
  event_entity_type text,
  event_entity_id uuid,
  event_metadata jsonb default '{"source":"administrative_script"}'::jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare new_id uuid;
begin
  if event_action not in ('auth.invitation.created','member.invited','administrator.bootstrap.completed') then
    raise exception using errcode = 'P0001', message = 'Administrative audit event not permitted.';
  end if;
  insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, outcome, metadata)
  values (target_organization_id, null, event_action, event_entity_type, event_entity_id, 'success', event_metadata)
  returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.record_administrative_audit(uuid,text,text,uuid,jsonb) from public, anon, authenticated, service_role;
grant execute on function public.record_administrative_audit(uuid,text,text,uuid,jsonb) to service_role;

create function private.audit_role_assignment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare role_slug text;
begin
  select role.slug into role_slug from public.roles role where role.id = coalesce(new.role_id, old.role_id);
  insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, outcome, metadata)
  values (
    coalesce(new.organization_id, old.organization_id), auth.uid(),
    case when tg_op = 'INSERT' then 'member.role.assigned' else 'member.role.removed' end,
    'organization_member', coalesce(new.membership_id, old.membership_id), 'success',
    jsonb_build_object('role', role_slug)
  );
  return coalesce(new, old);
end;
$$;

create trigger organization_member_roles_audit_insert
after insert on public.organization_member_roles for each row execute function private.audit_role_assignment();
create trigger organization_member_roles_audit_delete
after delete on public.organization_member_roles for each row execute function private.audit_role_assignment();

revoke all on function private.audit_role_assignment() from public, anon, authenticated, service_role;

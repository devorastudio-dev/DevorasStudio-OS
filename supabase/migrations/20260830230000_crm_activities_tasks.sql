create type public.crm_activity_type as enum ('call','whatsapp','email','meeting','instagram','note','other');
create type public.crm_task_status as enum ('pending','completed','cancelled');

create table public.crm_activities (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
  activity_type public.crm_activity_type not null, title text not null, description text,
  lead_id uuid, opportunity_id uuid, company_id uuid, contact_id uuid,
  assigned_membership_id uuid not null, occurred_at timestamptz not null,
  created_by uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default now(),
  constraint crm_activities_id_org_key unique(id,organization_id),
  constraint crm_activities_entity_check check(lead_id is not null or opportunity_id is not null),
  constraint crm_activities_title_check check(char_length(btrim(title)) between 2 and 160),
  constraint crm_activities_description_check check(description is null or char_length(btrim(description)) between 3 and 2000),
  constraint crm_activities_lead_fk foreign key(lead_id,organization_id) references public.leads(id,organization_id) on delete restrict,
  constraint crm_activities_opportunity_fk foreign key(opportunity_id,organization_id) references public.opportunities(id,organization_id) on delete restrict,
  constraint crm_activities_company_fk foreign key(company_id,organization_id) references public.crm_companies(id,organization_id) on delete restrict,
  constraint crm_activities_contact_fk foreign key(contact_id,organization_id) references public.crm_contacts(id,organization_id) on delete restrict,
  constraint crm_activities_assignee_fk foreign key(assigned_membership_id,organization_id) references public.organization_members(id,organization_id) on delete restrict
);

create table public.crm_tasks (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
  title text not null, description text, lead_id uuid, opportunity_id uuid, company_id uuid, contact_id uuid,
  assigned_membership_id uuid not null, due_at timestamptz not null, status public.crm_task_status not null default 'pending',
  completed_at timestamptz, completed_by uuid references public.profiles(id) on delete restrict,
  cancelled_at timestamptz, created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), version integer not null default 1,
  constraint crm_tasks_id_org_key unique(id,organization_id),
  constraint crm_tasks_entity_check check(num_nonnulls(lead_id,opportunity_id,company_id,contact_id)>0),
  constraint crm_tasks_title_check check(char_length(btrim(title)) between 2 and 160),
  constraint crm_tasks_description_check check(description is null or char_length(btrim(description)) between 3 and 1000),
  constraint crm_tasks_status_check check((status='pending' and completed_at is null and completed_by is null and cancelled_at is null) or (status='completed' and completed_at is not null and completed_by is not null and cancelled_at is null) or (status='cancelled' and completed_at is null and completed_by is null and cancelled_at is not null)),
  constraint crm_tasks_version_check check(version>0),
  constraint crm_tasks_lead_fk foreign key(lead_id,organization_id) references public.leads(id,organization_id) on delete restrict,
  constraint crm_tasks_opportunity_fk foreign key(opportunity_id,organization_id) references public.opportunities(id,organization_id) on delete restrict,
  constraint crm_tasks_company_fk foreign key(company_id,organization_id) references public.crm_companies(id,organization_id) on delete restrict,
  constraint crm_tasks_contact_fk foreign key(contact_id,organization_id) references public.crm_contacts(id,organization_id) on delete restrict,
  constraint crm_tasks_assignee_fk foreign key(assigned_membership_id,organization_id) references public.organization_members(id,organization_id) on delete restrict
);

create index crm_activities_org_occurred_idx on public.crm_activities(organization_id,occurred_at desc);
create index crm_activities_lead_idx on public.crm_activities(organization_id,lead_id,occurred_at desc) where lead_id is not null;
create index crm_activities_opportunity_idx on public.crm_activities(organization_id,opportunity_id,occurred_at desc) where opportunity_id is not null;
create index crm_tasks_org_status_due_idx on public.crm_tasks(organization_id,status,due_at);
create index crm_tasks_assignee_due_idx on public.crm_tasks(organization_id,assigned_membership_id,due_at) where status='pending';
create index crm_tasks_lead_due_idx on public.crm_tasks(organization_id,lead_id,due_at) where status='pending' and lead_id is not null;
create index crm_tasks_opportunity_due_idx on public.crm_tasks(organization_id,opportunity_id,due_at) where status='pending' and opportunity_id is not null;

create function private.validate_crm_activity_task_links(org_id uuid, lead_ref uuid, opportunity_ref uuid, company_ref uuid, contact_ref uuid, assignee_ref uuid)
returns void language plpgsql security definer set search_path='' as $$
declare member_status public.organization_member_status; linked_company uuid; lead_company uuid; lead_contact uuid; opportunity_lead uuid; opportunity_company uuid; opportunity_contact uuid;
begin
  select status into member_status from public.organization_members where id=assignee_ref and organization_id=org_id;
  if member_status is distinct from 'active' then raise exception using errcode='23514',message='CRM assignee must be an active member.'; end if;
  if opportunity_ref is not null then select lead_id,company_id,contact_id into opportunity_lead,opportunity_company,opportunity_contact from public.opportunities where id=opportunity_ref and organization_id=org_id; if not found then raise exception using errcode='23503',message='CRM opportunity is not available.'; end if; end if;
  if lead_ref is not null then select company_id,contact_id into lead_company,lead_contact from public.leads where id=lead_ref and organization_id=org_id; if not found then raise exception using errcode='23503',message='CRM lead is not available.'; end if; end if;
  if company_ref is not null and not exists(select 1 from public.crm_companies where id=company_ref and organization_id=org_id) then raise exception using errcode='23503',message='CRM company is not available.'; end if;
  if contact_ref is not null then select company_id into linked_company from public.crm_contacts where id=contact_ref and organization_id=org_id; if not found then raise exception using errcode='23503',message='CRM contact is not available.'; end if; if company_ref is not null and linked_company is distinct from company_ref then raise exception using errcode='23514',message='CRM contact does not match company.'; end if; end if;
  if opportunity_ref is not null and lead_ref is not null and opportunity_lead is distinct from lead_ref then raise exception using errcode='23514',message='CRM opportunity does not match lead.'; end if;
  if lead_ref is not null and company_ref is not null and lead_company is distinct from company_ref then raise exception using errcode='23514',message='CRM lead does not match company.'; end if;
  if lead_ref is not null and contact_ref is not null and lead_contact is distinct from contact_ref then raise exception using errcode='23514',message='CRM lead does not match contact.'; end if;
  if opportunity_ref is not null and company_ref is not null and opportunity_company is distinct from company_ref then raise exception using errcode='23514',message='CRM opportunity does not match company.'; end if;
  if opportunity_ref is not null and contact_ref is not null and opportunity_contact is distinct from contact_ref then raise exception using errcode='23514',message='CRM opportunity does not match contact.'; end if;
end $$;

create function public.create_crm_activity(activity_kind public.crm_activity_type, activity_title text, activity_description text, activity_occurred_at timestamptz, target_assigned_membership_id uuid, target_lead_id uuid default null, target_opportunity_id uuid default null, target_company_id uuid default null, target_contact_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare membership public.organization_members; activity_id uuid;
begin
 select * into membership from private.current_crm_membership();
 if membership.id is null or not private.has_permission('crm.write',membership.organization_id) then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
 if target_lead_id is null and target_opportunity_id is null then raise exception using errcode='23514',message='CRM activity requires a lead or opportunity.'; end if;
 perform private.validate_crm_activity_task_links(membership.organization_id,target_lead_id,target_opportunity_id,target_company_id,target_contact_id,target_assigned_membership_id);
 insert into public.crm_activities(organization_id,activity_type,title,description,lead_id,opportunity_id,company_id,contact_id,assigned_membership_id,occurred_at,created_by)
 values(membership.organization_id,activity_kind,btrim(activity_title),nullif(btrim(activity_description),''),target_lead_id,target_opportunity_id,target_company_id,target_contact_id,target_assigned_membership_id,activity_occurred_at,auth.uid()) returning id into activity_id;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(membership.organization_id,auth.uid(),'crm.activity.created','activity',activity_id,'success',jsonb_build_object('type',activity_kind)); return activity_id;
end $$;

create function public.create_crm_task(task_title text, task_description text, task_due_at timestamptz, target_assigned_membership_id uuid, target_lead_id uuid default null, target_opportunity_id uuid default null, target_company_id uuid default null, target_contact_id uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare membership public.organization_members; task_id uuid;
begin
 select * into membership from private.current_crm_membership(); if membership.id is null or not private.has_permission('crm.write',membership.organization_id) then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
 if num_nonnulls(target_lead_id,target_opportunity_id,target_company_id,target_contact_id)=0 then raise exception using errcode='23514',message='CRM task requires a related entity.'; end if;
 perform private.validate_crm_activity_task_links(membership.organization_id,target_lead_id,target_opportunity_id,target_company_id,target_contact_id,target_assigned_membership_id);
 insert into public.crm_tasks(organization_id,title,description,lead_id,opportunity_id,company_id,contact_id,assigned_membership_id,due_at,created_by)
 values(membership.organization_id,btrim(task_title),nullif(btrim(task_description),''),target_lead_id,target_opportunity_id,target_company_id,target_contact_id,target_assigned_membership_id,task_due_at,auth.uid()) returning id into task_id;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(membership.organization_id,auth.uid(),'crm.task.created','task',task_id,'success',jsonb_build_object('assigned',true)); return task_id;
end $$;

create function public.transition_crm_task(target_task_id uuid, expected_version integer, target_status public.crm_task_status)
returns integer language plpgsql security definer set search_path='' as $$
declare membership public.organization_members; item public.crm_tasks; audit_action text;
begin
 select * into membership from private.current_crm_membership(); if membership.id is null or not private.has_permission('crm.write',membership.organization_id) then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
 select * into item from public.crm_tasks where id=target_task_id and organization_id=membership.organization_id for update;
 if item.id is null or item.version<>expected_version then raise exception using errcode='P0001',message='CRM task changed; reload and retry.'; end if;
 if item.status=target_status then return item.version; end if;
 audit_action:=case target_status when 'completed' then 'crm.task.completed' when 'cancelled' then 'crm.task.cancelled' else 'crm.task.reopened' end;
 update public.crm_tasks set status=target_status,completed_at=case when target_status='completed' then now() end,completed_by=case when target_status='completed' then auth.uid() end,cancelled_at=case when target_status='cancelled' then now() end,updated_at=now(),version=version+1 where id=item.id;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(membership.organization_id,auth.uid(),audit_action,'task',item.id,'success',jsonb_build_object('from',item.status,'to',target_status)); return item.version+1;
end $$;

alter table public.crm_activities enable row level security; alter table public.crm_tasks enable row level security;
create policy "members read CRM activities" on public.crm_activities for select to authenticated using((select private.has_permission('crm.read',organization_id)));
create policy "members read CRM tasks" on public.crm_tasks for select to authenticated using((select private.has_permission('crm.read',organization_id)));
revoke all on table public.crm_activities,public.crm_tasks from public,anon,authenticated,service_role; grant select on table public.crm_activities,public.crm_tasks to authenticated;
revoke all on function private.validate_crm_activity_task_links(uuid,uuid,uuid,uuid,uuid,uuid),public.create_crm_activity(public.crm_activity_type,text,text,timestamptz,uuid,uuid,uuid,uuid,uuid),public.create_crm_task(text,text,timestamptz,uuid,uuid,uuid,uuid,uuid),public.transition_crm_task(uuid,integer,public.crm_task_status) from public,anon,authenticated,service_role;
grant execute on function public.create_crm_activity(public.crm_activity_type,text,text,timestamptz,uuid,uuid,uuid,uuid,uuid),public.create_crm_task(text,text,timestamptz,uuid,uuid,uuid,uuid,uuid),public.transition_crm_task(uuid,integer,public.crm_task_status) to authenticated;

alter table public.audit_logs drop constraint audit_logs_action_catalog;
alter table public.audit_logs add constraint audit_logs_action_catalog check(action=any(array[
'auth.login.succeeded','auth.login.failed','auth.logout.succeeded','auth.password_reset.requested','auth.password_reset.completed','auth.invitation.created','auth.invitation.accepted','auth.invitation.failed','auth.mfa.enrollment_started','auth.mfa.enrollment_completed','auth.mfa.challenge.succeeded','auth.mfa.challenge.failed','auth.mfa.factor_added','auth.mfa.factor_removed','auth.access.denied','member.invited','member.activated','member.suspended','member.reactivated','member.role.assigned','member.role.removed','permission.assignment.denied','administrator.bootstrap.completed',
'crm.lead.created','crm.lead.updated','crm.lead.assigned','crm.lead.triage_changed','crm.lead.archived','crm.lead.reactivated','crm.company.created','crm.company.updated','crm.company.archived','crm.company.reactivated','crm.contact.created','crm.contact.updated','crm.contact.archived','crm.contact.reactivated','crm.opportunity.created','crm.opportunity.updated','crm.opportunity.assigned','crm.opportunity.stage_changed','crm.opportunity.won','crm.opportunity.lost','crm.opportunity.reopened','crm.opportunity.archived',
'crm.activity.created','crm.task.created','crm.task.updated','crm.task.assigned','crm.task.completed','crm.task.cancelled','crm.task.reopened'
]));

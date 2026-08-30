create type public.pipeline_stage_category as enum ('open', 'won', 'lost');
create type public.opportunity_loss_reason as enum (
  'price', 'no_response', 'no_interest', 'timing', 'competitor',
  'unmet_need', 'other'
);

alter table public.leads
  add constraint leads_id_organization_key unique (id, organization_id);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  position smallint not null,
  category public.pipeline_stage_category not null default 'open',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pipeline_stages_id_organization_key unique (id, organization_id),
  constraint pipeline_stages_name_check check (char_length(btrim(name)) between 1 and 80),
  constraint pipeline_stages_position_check check (position between 1 and 100),
  constraint pipeline_stages_org_position_key unique (organization_id, position),
  constraint pipeline_stages_org_name_key unique (organization_id, name)
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  lead_id uuid,
  company_id uuid,
  contact_id uuid,
  stage_id uuid not null,
  assigned_membership_id uuid,
  title text not null,
  estimated_value numeric(14,2),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  loss_reason public.opportunity_loss_reason,
  loss_reason_detail text,
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint opportunities_id_organization_key unique (id, organization_id),
  constraint opportunities_lead_fk foreign key (lead_id, organization_id) references public.leads(id, organization_id) on delete restrict,
  constraint opportunities_company_fk foreign key (company_id, organization_id) references public.crm_companies(id, organization_id) on delete restrict,
  constraint opportunities_contact_fk foreign key (contact_id, organization_id) references public.crm_contacts(id, organization_id) on delete restrict,
  constraint opportunities_stage_fk foreign key (stage_id, organization_id) references public.pipeline_stages(id, organization_id) on delete restrict,
  constraint opportunities_assignee_fk foreign key (assigned_membership_id, organization_id) references public.organization_members(id, organization_id) on delete restrict,
  constraint opportunities_title_check check (char_length(btrim(title)) between 2 and 160),
  constraint opportunities_value_check check (estimated_value is null or (estimated_value >= 0 and estimated_value <= 999999999999.99)),
  constraint opportunities_loss_detail_check check (loss_reason_detail is null or char_length(btrim(loss_reason_detail)) between 3 and 240),
  constraint opportunities_other_loss_check check (loss_reason <> 'other' or loss_reason_detail is not null),
  constraint opportunities_version_check check (version > 0)
);

create unique index opportunities_one_per_lead_idx
  on public.opportunities (organization_id, lead_id) where lead_id is not null;
create index opportunities_org_stage_idx on public.opportunities (organization_id, stage_id, updated_at desc);
create index opportunities_org_assignee_idx on public.opportunities (organization_id, assigned_membership_id) where assigned_membership_id is not null;
create index opportunities_org_open_idx on public.opportunities (organization_id, closed_at, archived_at);

create table public.opportunity_stage_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  opportunity_id uuid not null,
  previous_stage_id uuid,
  new_stage_id uuid not null,
  changed_by uuid references public.profiles(id) on delete set null,
  context text not null default 'manual',
  created_at timestamptz not null default now(),
  constraint opportunity_history_opportunity_fk foreign key (opportunity_id, organization_id) references public.opportunities(id, organization_id) on delete restrict,
  constraint opportunity_history_previous_stage_fk foreign key (previous_stage_id, organization_id) references public.pipeline_stages(id, organization_id) on delete restrict,
  constraint opportunity_history_new_stage_fk foreign key (new_stage_id, organization_id) references public.pipeline_stages(id, organization_id) on delete restrict,
  constraint opportunity_history_context_check check (context in ('created','manual','reopened')),
  constraint opportunity_history_distinct_check check (previous_stage_id is null or previous_stage_id <> new_stage_id)
);
create index opportunity_history_opportunity_created_idx on public.opportunity_stage_history (organization_id, opportunity_id, created_at desc);

create function private.seed_pipeline_stages(target_organization_id uuid)
returns void language sql security definer set search_path = '' as $$
  insert into public.pipeline_stages (organization_id,name,position,category) values
    (target_organization_id,'Novo',1,'open'),
    (target_organization_id,'Contato iniciado',2,'open'),
    (target_organization_id,'Qualificado',3,'open'),
    (target_organization_id,'Reuniao agendada',4,'open'),
    (target_organization_id,'Proposta',5,'open'),
    (target_organization_id,'Negociacao',6,'open'),
    (target_organization_id,'Ganho',7,'won'),
    (target_organization_id,'Perdido',8,'lost')
  on conflict (organization_id,position) do nothing;
$$;
create function private.seed_pipeline_stages_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin perform private.seed_pipeline_stages(new.id); return new; end; $$;
create trigger organizations_seed_pipeline_stages after insert on public.organizations
for each row execute function private.seed_pipeline_stages_trigger();
do $$ declare item record; begin for item in select id from public.organizations loop perform private.seed_pipeline_stages(item.id); end loop; end $$;

create function public.create_opportunity_from_lead(
  target_lead_id uuid,
  opportunity_title text default null,
  opportunity_value numeric default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare membership public.organization_members; source_lead public.leads; initial_stage uuid; opportunity_id uuid;
begin
  select * into membership from private.current_crm_membership();
  if membership.id is null or not private.has_permission('crm.write',membership.organization_id) then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
  select * into source_lead from public.leads where id=target_lead_id and organization_id=membership.organization_id and archived_at is null for update;
  if source_lead.id is null then raise exception using errcode='P0001',message='Lead is not available.'; end if;
  select id into opportunity_id from public.opportunities where organization_id=membership.organization_id and lead_id=source_lead.id;
  if opportunity_id is not null then return opportunity_id; end if;
  select id into initial_stage from public.pipeline_stages where organization_id=membership.organization_id and position=1 and category='open' and is_active;
  if initial_stage is null then raise exception using errcode='P0001',message='Pipeline is not configured.'; end if;
  insert into public.opportunities(organization_id,lead_id,company_id,contact_id,stage_id,assigned_membership_id,title,estimated_value,created_by,updated_by)
  values(membership.organization_id,source_lead.id,source_lead.company_id,source_lead.contact_id,initial_stage,source_lead.assigned_membership_id,coalesce(nullif(btrim(opportunity_title),''),'Oportunidade - '||source_lead.full_name),opportunity_value,auth.uid(),auth.uid()) returning id into opportunity_id;
  insert into public.opportunity_stage_history(organization_id,opportunity_id,new_stage_id,changed_by,context)
  values(membership.organization_id,opportunity_id,initial_stage,auth.uid(),'created');
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata)
  values(membership.organization_id,auth.uid(),'crm.opportunity.created','opportunity',opportunity_id,'success','{}');
  return opportunity_id;
end; $$;

create function public.move_opportunity(
  target_opportunity_id uuid,
  target_stage_id uuid,
  expected_version integer,
  target_loss_reason public.opportunity_loss_reason default null,
  target_loss_detail text default null
) returns integer language plpgsql security definer set search_path = '' as $$
declare membership public.organization_members; item public.opportunities; destination public.pipeline_stages; history_context text := 'manual';
begin
  select * into membership from private.current_crm_membership();
  if membership.id is null or not private.has_permission('crm.write',membership.organization_id) then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
  select * into item from public.opportunities where id=target_opportunity_id and organization_id=membership.organization_id for update;
  if item.id is null or item.version<>expected_version then raise exception using errcode='P0001',message='Opportunity changed; reload and retry.'; end if;
  select * into destination from public.pipeline_stages where id=target_stage_id and organization_id=membership.organization_id and is_active;
  if destination.id is null then raise exception using errcode='P0001',message='Pipeline stage is not available.'; end if;
  if item.stage_id=destination.id then return item.version; end if;
  if destination.category='lost' and target_loss_reason is null then raise exception using errcode='23514',message='Loss reason is required.'; end if;
  if destination.category='lost' and target_loss_reason='other' and nullif(btrim(target_loss_detail),'') is null then raise exception using errcode='23514',message='Loss detail is required.'; end if;
  if item.closed_at is not null and destination.category='open' then history_context := 'reopened'; end if;
  update public.opportunities set stage_id=destination.id,closed_at=case when destination.category in('won','lost') then now() else null end,
    loss_reason=case when destination.category='lost' then target_loss_reason else null end,
    loss_reason_detail=case when destination.category='lost' then nullif(btrim(target_loss_detail),'') else null end,
    updated_by=auth.uid(),updated_at=now(),version=item.version+1 where id=item.id;
  insert into public.opportunity_stage_history(organization_id,opportunity_id,previous_stage_id,new_stage_id,changed_by,context)
  values(membership.organization_id,item.id,item.stage_id,destination.id,auth.uid(),history_context);
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata)
  values(membership.organization_id,auth.uid(),case destination.category when 'won' then 'crm.opportunity.won' when 'lost' then 'crm.opportunity.lost' else case when history_context='reopened' then 'crm.opportunity.reopened' else 'crm.opportunity.stage_changed' end end,'opportunity',item.id,'success',jsonb_build_object('from_stage',item.stage_id,'to_stage',destination.id));
  return item.version+1;
end; $$;

create function public.update_opportunity(
  target_opportunity_id uuid,
  expected_version integer,
  opportunity_title text,
  opportunity_value numeric default null,
  target_assigned_membership_id uuid default null,
  target_archived boolean default false
) returns integer language plpgsql security definer set search_path = '' as $$
declare membership public.organization_members; item public.opportunities; assignee_status public.organization_member_status; event_action text := 'crm.opportunity.updated';
begin
  select * into membership from private.current_crm_membership();
  if membership.id is null or not private.has_permission('crm.write',membership.organization_id) then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
  select * into item from public.opportunities where id=target_opportunity_id and organization_id=membership.organization_id for update;
  if item.id is null or item.version<>expected_version then raise exception using errcode='P0001',message='Opportunity changed; reload and retry.'; end if;
  if char_length(btrim(opportunity_title)) not between 2 and 160 then raise exception using errcode='23514',message='Opportunity title is invalid.'; end if;
  if opportunity_value is not null and (opportunity_value<0 or opportunity_value>999999999999.99) then raise exception using errcode='23514',message='Opportunity value is invalid.'; end if;
  if target_assigned_membership_id is not null then
    select status into assignee_status from public.organization_members where id=target_assigned_membership_id and organization_id=membership.organization_id;
    if assignee_status is distinct from 'active' then raise exception using errcode='23514',message='Opportunity assignee must be an active member.'; end if;
  end if;
  if item.assigned_membership_id is distinct from target_assigned_membership_id then event_action := 'crm.opportunity.assigned'; end if;
  if item.archived_at is null and target_archived then event_action := 'crm.opportunity.archived'; end if;
  update public.opportunities set title=btrim(opportunity_title),estimated_value=opportunity_value,assigned_membership_id=target_assigned_membership_id,
    archived_at=case when target_archived then coalesce(item.archived_at,now()) else null end,updated_by=auth.uid(),updated_at=now(),version=item.version+1 where id=item.id;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata)
  values(membership.organization_id,auth.uid(),event_action,'opportunity',item.id,'success',jsonb_build_object('assigned',target_assigned_membership_id is not null,'archived',target_archived));
  return item.version+1;
end; $$;

alter table public.pipeline_stages enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_stage_history enable row level security;
create policy "members read pipeline stages" on public.pipeline_stages for select to authenticated using ((select private.has_permission('crm.read',organization_id)));
create policy "members read opportunities" on public.opportunities for select to authenticated using ((select private.has_permission('crm.read',organization_id)));
create policy "members read opportunity history" on public.opportunity_stage_history for select to authenticated using ((select private.has_permission('crm.read',organization_id)));
revoke all on table public.pipeline_stages,public.opportunities,public.opportunity_stage_history from public,anon,authenticated,service_role;
grant select on table public.pipeline_stages,public.opportunities,public.opportunity_stage_history to authenticated;
revoke all on function public.create_opportunity_from_lead(uuid,text,numeric),public.move_opportunity(uuid,uuid,integer,public.opportunity_loss_reason,text),public.update_opportunity(uuid,integer,text,numeric,uuid,boolean),private.seed_pipeline_stages(uuid),private.seed_pipeline_stages_trigger() from public,anon,authenticated,service_role;
grant execute on function public.create_opportunity_from_lead(uuid,text,numeric),public.move_opportunity(uuid,uuid,integer,public.opportunity_loss_reason,text),public.update_opportunity(uuid,integer,text,numeric,uuid,boolean) to authenticated;

alter table public.audit_logs drop constraint audit_logs_action_catalog;
alter table public.audit_logs add constraint audit_logs_action_catalog check (action = any (array[
  'auth.login.succeeded','auth.login.failed','auth.logout.succeeded','auth.password_reset.requested','auth.password_reset.completed','auth.invitation.created','auth.invitation.accepted','auth.invitation.failed','auth.mfa.enrollment_started','auth.mfa.enrollment_completed','auth.mfa.challenge.succeeded','auth.mfa.challenge.failed','auth.mfa.factor_added','auth.mfa.factor_removed','auth.access.denied','member.invited','member.activated','member.suspended','member.reactivated','member.role.assigned','member.role.removed','permission.assignment.denied','administrator.bootstrap.completed',
  'crm.lead.created','crm.lead.updated','crm.lead.assigned','crm.lead.triage_changed','crm.lead.archived','crm.lead.reactivated','crm.company.created','crm.company.updated','crm.company.archived','crm.company.reactivated','crm.contact.created','crm.contact.updated','crm.contact.archived','crm.contact.reactivated',
  'crm.opportunity.created','crm.opportunity.updated','crm.opportunity.assigned','crm.opportunity.stage_changed','crm.opportunity.won','crm.opportunity.lost','crm.opportunity.reopened','crm.opportunity.archived'
]));

comment on table public.opportunities is 'Commercial opportunities; one idempotent opportunity per source lead.';
comment on table public.opportunity_stage_history is 'Immutable append-only history written by transactional pipeline RPCs.';

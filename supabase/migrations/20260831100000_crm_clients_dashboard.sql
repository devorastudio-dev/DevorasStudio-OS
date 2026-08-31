alter type public.crm_lead_triage_status add value if not exists 'converted';

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  company_id uuid,
  primary_contact_id uuid,
  source_lead_id uuid,
  source_opportunity_id uuid not null,
  assigned_membership_id uuid,
  state public.crm_record_state not null default 'active',
  converted_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0),
  constraint clients_id_organization_key unique (id, organization_id),
  constraint clients_source_opportunity_key unique (source_opportunity_id, organization_id),
  constraint clients_company_fk foreign key (company_id, organization_id) references public.crm_companies(id, organization_id) on delete restrict,
  constraint clients_contact_fk foreign key (primary_contact_id, organization_id) references public.crm_contacts(id, organization_id) on delete restrict,
  constraint clients_lead_fk foreign key (source_lead_id, organization_id) references public.leads(id, organization_id) on delete restrict,
  constraint clients_opportunity_fk foreign key (source_opportunity_id, organization_id) references public.opportunities(id, organization_id) on delete restrict,
  constraint clients_assignee_fk foreign key (assigned_membership_id, organization_id) references public.organization_members(id, organization_id) on delete restrict
);

create unique index clients_active_company_key on public.clients (organization_id, company_id) where state = 'active' and company_id is not null;
create unique index clients_active_person_key on public.clients (organization_id, primary_contact_id) where state = 'active' and company_id is null and primary_contact_id is not null;
create index clients_organization_converted_idx on public.clients (organization_id, converted_at desc);
create index clients_assignee_idx on public.clients (organization_id, assigned_membership_id) where state = 'active';

create table public.client_opportunities (
  client_id uuid not null,
  organization_id uuid not null,
  opportunity_id uuid not null,
  linked_at timestamptz not null default now(),
  linked_by uuid not null references public.profiles(id) on delete restrict,
  primary key (client_id, opportunity_id),
  constraint client_opportunities_client_fk foreign key (client_id, organization_id) references public.clients(id, organization_id) on delete cascade,
  constraint client_opportunities_opportunity_fk foreign key (opportunity_id, organization_id) references public.opportunities(id, organization_id) on delete restrict,
  constraint client_opportunities_one_client_key unique (opportunity_id, organization_id)
);
create index client_opportunities_organization_idx on public.client_opportunities (organization_id, linked_at desc);

create function public.convert_won_opportunity_to_client(target_opportunity_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  membership public.organization_members;
  item public.opportunities;
  stage_category public.pipeline_stage_category;
  existing_client_id uuid;
  result_client_id uuid;
begin
  select * into membership from private.current_crm_membership();
  if membership.id is null or not private.has_permission('crm.write', membership.organization_id) then
    raise exception using errcode = 'P0001', message = 'CRM operation not permitted.';
  end if;

  select opportunity into item
  from public.opportunities opportunity
  where opportunity.id = target_opportunity_id and opportunity.organization_id = membership.organization_id
  for update;

  if item.id is null or item.archived_at is not null then
    raise exception using errcode = 'P0002', message = 'Opportunity not available.';
  end if;
  select stage.category into stage_category from public.pipeline_stages stage
  where stage.id = item.stage_id and stage.organization_id = membership.organization_id;
  if stage_category <> 'won' then
    raise exception using errcode = '23514', message = 'Only won opportunities can be converted.';
  end if;

  select relation.client_id into result_client_id
  from public.client_opportunities relation
  where relation.opportunity_id = item.id and relation.organization_id = membership.organization_id;
  if result_client_id is not null then return result_client_id; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(membership.organization_id::text || ':' || coalesce(item.company_id::text,item.contact_id::text,item.id::text),0));
  if item.company_id is not null then
    select id into existing_client_id from public.clients
    where organization_id = membership.organization_id and company_id = item.company_id and state = 'active'
    order by converted_at limit 1 for update;
  elsif item.contact_id is not null then
    select id into existing_client_id from public.clients
    where organization_id = membership.organization_id and company_id is null and primary_contact_id = item.contact_id and state = 'active'
    order by converted_at limit 1 for update;
  end if;

  if existing_client_id is null then
    insert into public.clients (organization_id, company_id, primary_contact_id, source_lead_id, source_opportunity_id, assigned_membership_id, created_by)
    values (membership.organization_id, item.company_id, item.contact_id, item.lead_id, item.id, item.assigned_membership_id, auth.uid())
    returning id into result_client_id;
    insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, outcome, metadata)
    values (membership.organization_id, auth.uid(), 'crm.client.created', 'client', result_client_id, 'success', jsonb_build_object('source', 'won_opportunity'));
  else
    result_client_id := existing_client_id;
  end if;

  insert into public.client_opportunities (client_id, organization_id, opportunity_id, linked_by)
  values (result_client_id, membership.organization_id, item.id, auth.uid());

  if item.lead_id is not null then
    update public.leads set triage_status = 'converted', disqualification_reason = null,
      internal_updated_at = now(), internal_updated_by = auth.uid(), version = version + 1
    where id = item.lead_id and organization_id = membership.organization_id and triage_status <> 'converted';
  end if;

  insert into public.audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, outcome, metadata)
  values (membership.organization_id, auth.uid(), 'crm.opportunity.converted', 'opportunity', item.id, 'success', jsonb_build_object('reused_client', existing_client_id is not null));
  return result_client_id;
end $$;

create function public.get_crm_dashboard(period_days integer default 30)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  membership public.organization_members;
  since_at timestamptz;
  today_start timestamptz;
  tomorrow_start timestamptz;
  result jsonb;
begin
  if period_days not in (7, 30, 90) then raise exception using errcode = '22023', message = 'Invalid dashboard period.'; end if;
  select * into membership from private.current_crm_membership();
  if membership.id is null or not private.has_permission('crm.read', membership.organization_id) then
    raise exception using errcode = 'P0001', message = 'CRM operation not permitted.';
  end if;
  since_at := now() - make_interval(days => period_days);
  today_start := (current_timestamp at time zone 'America/Sao_Paulo')::date at time zone 'America/Sao_Paulo';
  tomorrow_start := today_start + interval '1 day';

  select jsonb_build_object(
    'periodDays', period_days,
    'activeLeads', (select count(*) from public.leads l where l.organization_id=membership.organization_id and l.archived_at is null and l.triage_status <> 'converted'),
    'openOpportunities', (select count(*) from public.opportunities o join public.pipeline_stages s on s.id=o.stage_id where o.organization_id=membership.organization_id and o.archived_at is null and s.category='open'),
    'openPipelineValue', (select coalesce(sum(o.estimated_value),0) from public.opportunities o join public.pipeline_stages s on s.id=o.stage_id where o.organization_id=membership.organization_id and o.archived_at is null and s.category='open'),
    'wonOpportunities', (select count(*) from public.opportunities o join public.pipeline_stages s on s.id=o.stage_id where o.organization_id=membership.organization_id and s.category='won' and o.closed_at>=since_at),
    'lostOpportunities', (select count(*) from public.opportunities o join public.pipeline_stages s on s.id=o.stage_id where o.organization_id=membership.organization_id and s.category='lost' and o.closed_at>=since_at),
    'convertedClients', (select count(*) from public.clients c where c.organization_id=membership.organization_id and c.converted_at>=since_at),
    'overdueTasks', (select count(*) from public.crm_tasks t where t.organization_id=membership.organization_id and t.status='pending' and t.due_at<today_start),
    'tasksDueToday', (select count(*) from public.crm_tasks t where t.organization_id=membership.organization_id and t.status='pending' and t.due_at>=today_start and t.due_at<tomorrow_start),
    'leadsWithoutNextAction', (select count(*) from public.leads l where l.organization_id=membership.organization_id and l.archived_at is null and l.triage_status<>'converted' and not exists(select 1 from public.crm_tasks t where t.lead_id=l.id and t.organization_id=l.organization_id and t.status='pending')),
    'opportunitiesWithoutNextAction', (select count(*) from public.opportunities o join public.pipeline_stages s on s.id=o.stage_id where o.organization_id=membership.organization_id and o.archived_at is null and s.category='open' and not exists(select 1 from public.crm_tasks t where t.opportunity_id=o.id and t.organization_id=o.organization_id and t.status='pending')),
    'pipelineByStage', coalesce((select jsonb_agg(jsonb_build_object('stage',q.name,'count',q.total,'value',q.value) order by q.position) from (select s.name,s.position,count(o.id) total,coalesce(sum(o.estimated_value),0) value from public.pipeline_stages s left join public.opportunities o on o.stage_id=s.id and o.organization_id=s.organization_id and o.archived_at is null where s.organization_id=membership.organization_id and s.category='open' and s.is_active group by s.id,s.name,s.position) q),'[]'::jsonb),
    'lossReasons', coalesce((select jsonb_agg(jsonb_build_object('reason',q.reason,'count',q.total) order by q.total desc) from (select coalesce(o.loss_reason::text,'not_informed') reason,count(*) total from public.opportunities o join public.pipeline_stages s on s.id=o.stage_id where o.organization_id=membership.organization_id and s.category='lost' and o.closed_at>=since_at group by o.loss_reason) q),'[]'::jsonb)
  ) into result;
  return result || jsonb_build_object('conversionRate', case when ((result->>'wonOpportunities')::numeric + (result->>'lostOpportunities')::numeric)=0 then 0 else round((result->>'convertedClients')::numeric * 100 / ((result->>'wonOpportunities')::numeric + (result->>'lostOpportunities')::numeric),2) end);
end $$;

create function public.list_crm_clients(search_text text default null, client_state public.crm_record_state default null, assigned_to uuid default null, period_days integer default null, page_number integer default 1, page_size integer default 20)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare membership public.organization_members; result jsonb;
begin
  if period_days is not null and period_days not in (7,30,90) then raise exception using errcode='22023',message='Invalid client period.'; end if;
  if page_number < 1 or page_size < 1 or page_size > 100 then raise exception using errcode='22023',message='Invalid pagination.'; end if;
  select * into membership from private.current_crm_membership();
  if membership.id is null or not private.has_permission('crm.read',membership.organization_id) then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
  with filtered as (
    select c.*, coalesce(company.display_name,contact.full_name,lead.full_name,'Cliente') display_name,
      contact.full_name contact_name, opportunity.title source_opportunity_title
    from public.clients c
    left join public.crm_companies company on company.id=c.company_id and company.organization_id=c.organization_id
    left join public.crm_contacts contact on contact.id=c.primary_contact_id and contact.organization_id=c.organization_id
    left join public.leads lead on lead.id=c.source_lead_id and lead.organization_id=c.organization_id
    join public.opportunities opportunity on opportunity.id=c.source_opportunity_id and opportunity.organization_id=c.organization_id
    where c.organization_id=membership.organization_id
      and (client_state is null or c.state=client_state)
      and (assigned_to is null or c.assigned_membership_id=assigned_to)
      and (period_days is null or c.converted_at>=now()-make_interval(days=>period_days))
      and (nullif(btrim(search_text),'') is null or company.display_name ilike '%'||btrim(search_text)||'%' or contact.full_name ilike '%'||btrim(search_text)||'%' or lead.full_name ilike '%'||btrim(search_text)||'%')
  ), paged as (
    select * from filtered order by converted_at desc offset (page_number-1)*page_size limit page_size
  )
  select jsonb_build_object('total',(select count(*) from filtered),'items',coalesce((select jsonb_agg(jsonb_build_object('id',id,'displayName',display_name,'contactName',contact_name,'state',state,'convertedAt',converted_at,'sourceOpportunityTitle',source_opportunity_title) order by converted_at desc) from paged),'[]'::jsonb)) into result;
  return result;
end $$;

alter table public.clients enable row level security;
alter table public.client_opportunities enable row level security;
create policy "members read clients" on public.clients for select to authenticated using ((select private.has_permission('crm.read', organization_id)));
create policy "members read client opportunities" on public.client_opportunities for select to authenticated using ((select private.has_permission('crm.read', organization_id)));
revoke all on table public.clients, public.client_opportunities from public, anon, authenticated, service_role;
grant select on table public.clients, public.client_opportunities to authenticated;
revoke all on function public.convert_won_opportunity_to_client(uuid), public.get_crm_dashboard(integer), public.list_crm_clients(text,public.crm_record_state,uuid,integer,integer,integer) from public, anon, authenticated, service_role;
grant execute on function public.convert_won_opportunity_to_client(uuid), public.get_crm_dashboard(integer), public.list_crm_clients(text,public.crm_record_state,uuid,integer,integer,integer) to authenticated;

alter table public.audit_logs drop constraint audit_logs_action_catalog;
alter table public.audit_logs add constraint audit_logs_action_catalog check(action=any(array[
'auth.login.succeeded','auth.login.failed','auth.logout.succeeded','auth.password_reset.requested','auth.password_reset.completed','auth.invitation.created','auth.invitation.accepted','auth.invitation.failed','auth.mfa.enrollment_started','auth.mfa.enrollment_completed','auth.mfa.challenge.succeeded','auth.mfa.challenge.failed','auth.mfa.factor_added','auth.mfa.factor_removed','auth.access.denied','member.invited','member.activated','member.suspended','member.reactivated','member.role.assigned','member.role.removed','permission.assignment.denied','administrator.bootstrap.completed',
'crm.lead.created','crm.lead.updated','crm.lead.assigned','crm.lead.triage_changed','crm.lead.archived','crm.lead.reactivated','crm.company.created','crm.company.updated','crm.company.archived','crm.company.reactivated','crm.contact.created','crm.contact.updated','crm.contact.archived','crm.contact.reactivated','crm.opportunity.created','crm.opportunity.updated','crm.opportunity.assigned','crm.opportunity.stage_changed','crm.opportunity.won','crm.opportunity.lost','crm.opportunity.reopened','crm.opportunity.archived','crm.activity.created','crm.task.created','crm.task.updated','crm.task.assigned','crm.task.completed','crm.task.cancelled','crm.task.reopened','crm.client.created','crm.opportunity.converted'
]));

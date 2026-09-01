create type public.service_unit as enum ('project', 'hour', 'month', 'unit', 'custom');
create type public.proposal_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled');

insert into public.permissions (key, description)
values ('proposals.write', 'Criar e editar catalogo e propostas em rascunho.')
on conflict (key) do update set description = excluded.description;

insert into public.role_permissions (role_id, permission_id)
select role.id, permission.id
from public.roles role
join public.permissions permission on permission.key = 'proposals.write'
where role.slug in ('administrador', 'socio', 'colaborador')
on conflict do nothing;

create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  description text,
  default_unit public.service_unit not null default 'project',
  default_price numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint services_id_organization_key unique (id, organization_id),
  constraint services_name_check check (char_length(btrim(name)) between 2 and 160),
  constraint services_description_check check (description is null or char_length(description) <= 2000),
  constraint services_default_price_check check (default_price between 0 and 999999999999.99)
);
create index services_org_active_name_idx on public.services (organization_id, is_active, lower(name));

create table public.proposal_counters (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  proposal_year integer not null check (proposal_year between 2020 and 9999),
  last_number integer not null check (last_number > 0),
  primary key (organization_id, proposal_year)
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  proposal_number text not null,
  client_id uuid not null,
  opportunity_id uuid,
  title text not null,
  status public.proposal_status not null default 'draft',
  valid_until date,
  currency text not null default 'BRL',
  subtotal numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1,
  constraint proposals_id_organization_key unique (id, organization_id),
  constraint proposals_org_number_key unique (organization_id, proposal_number),
  constraint proposals_client_fk foreign key (client_id, organization_id) references public.clients(id, organization_id) on delete restrict,
  constraint proposals_opportunity_fk foreign key (opportunity_id, organization_id) references public.opportunities(id, organization_id) on delete restrict,
  constraint proposals_title_check check (char_length(btrim(title)) between 2 and 160),
  constraint proposals_number_check check (proposal_number ~ '^DEV-[0-9]{4}-[0-9]{4,}$'),
  constraint proposals_currency_check check (currency = 'BRL'),
  constraint proposals_subtotal_check check (subtotal between 0 and 999999999999.99),
  constraint proposals_discount_check check (discount_amount between 0 and subtotal),
  constraint proposals_total_check check (total_amount = subtotal - discount_amount and total_amount >= 0),
  constraint proposals_version_check check (version > 0),
  constraint proposals_valid_until_check check (valid_until is null or valid_until between date '2020-01-01' and date '9999-12-31')
);
create index proposals_org_created_idx on public.proposals (organization_id, created_at desc);
create index proposals_org_status_created_idx on public.proposals (organization_id, status, created_at desc);
create index proposals_org_client_idx on public.proposals (organization_id, client_id, created_at desc);
create index proposals_org_opportunity_idx on public.proposals (organization_id, opportunity_id) where opportunity_id is not null;
create index proposals_org_valid_until_idx on public.proposals (organization_id, valid_until) where valid_until is not null;

create table public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  proposal_id uuid not null,
  service_id uuid,
  position integer not null,
  name text not null,
  description text,
  quantity numeric(12,3) not null,
  unit public.service_unit not null,
  unit_price numeric(14,2) not null,
  line_total numeric(14,2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposal_items_id_organization_key unique (id, organization_id),
  constraint proposal_items_proposal_fk foreign key (proposal_id, organization_id) references public.proposals(id, organization_id) on delete cascade,
  constraint proposal_items_service_fk foreign key (service_id, organization_id) references public.services(id, organization_id) on delete restrict,
  constraint proposal_items_position_key unique (proposal_id, position),
  constraint proposal_items_position_check check (position > 0),
  constraint proposal_items_name_check check (char_length(btrim(name)) between 2 and 160),
  constraint proposal_items_description_check check (description is null or char_length(description) <= 2000),
  constraint proposal_items_quantity_check check (quantity > 0 and quantity <= 999999999.999),
  constraint proposal_items_unit_price_check check (unit_price between 0 and 999999999999.99),
  constraint proposal_items_line_total_check check (line_total between 0 and 999999999999.99)
);
create index proposal_items_org_proposal_position_idx on public.proposal_items (organization_id, proposal_id, position);
create index proposal_items_org_service_idx on public.proposal_items (organization_id, service_id) where service_id is not null;

create function private.current_proposals_membership(required_permission text)
returns public.organization_members language sql stable security definer set search_path = '' as $$
  select membership from public.organization_members membership
  where membership.user_id = (select auth.uid()) and membership.status = 'active'
    and private.has_permission(required_permission, membership.organization_id)
  limit 1;
$$;

create function private.assert_draft_proposal(target_proposal_id uuid)
returns public.proposals language plpgsql security definer set search_path = '' as $$
declare membership public.organization_members; item public.proposals;
begin
  select * into membership from private.current_proposals_membership('proposals.write');
  if membership.id is null then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
  select * into item from public.proposals where id=target_proposal_id and organization_id=membership.organization_id for update;
  if item.id is null then raise exception using errcode='P0002',message='Proposal not available.'; end if;
  if item.status <> 'draft' then raise exception using errcode='23514',message='Only draft proposals can be edited.'; end if;
  return item;
end $$;

create function private.recalculate_proposal(target_proposal_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare calculated_subtotal numeric(14,2);
begin
  select coalesce(sum(line_total),0) into calculated_subtotal from public.proposal_items where proposal_id=target_proposal_id;
  update public.proposals set subtotal=calculated_subtotal,
    discount_amount=least(discount_amount,calculated_subtotal),
    total_amount=calculated_subtotal-least(discount_amount,calculated_subtotal),
    updated_by=auth.uid(),updated_at=now(),version=version+1 where id=target_proposal_id;
end $$;

create function public.upsert_service(target_service_id uuid, service_name text, service_description text, service_default_unit public.service_unit, service_default_price numeric, service_is_active boolean default true)
returns uuid language plpgsql security definer set search_path = '' as $$
declare membership public.organization_members; result_id uuid; was_active boolean;
begin
  select * into membership from private.current_proposals_membership('proposals.write');
  if membership.id is null then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
  if char_length(btrim(service_name)) not between 2 and 160 or service_default_price < 0 or service_default_price > 999999999999.99 then raise exception using errcode='23514',message='Service data is invalid.'; end if;
  if target_service_id is null then
    insert into public.services(organization_id,name,description,default_unit,default_price,is_active,created_by)
    values(membership.organization_id,btrim(service_name),nullif(btrim(service_description),''),service_default_unit,service_default_price,service_is_active,auth.uid()) returning id into result_id;
    insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(membership.organization_id,auth.uid(),'service.created','service',result_id,'success','{}');
  else
    select is_active into was_active from public.services where id=target_service_id and organization_id=membership.organization_id for update;
    if not found then raise exception using errcode='P0002',message='Service not available.'; end if;
    update public.services set name=btrim(service_name),description=nullif(btrim(service_description),''),default_unit=service_default_unit,default_price=service_default_price,is_active=service_is_active,updated_by=auth.uid(),updated_at=now() where id=target_service_id;
    result_id:=target_service_id;
    insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(membership.organization_id,auth.uid(),case when was_active and not service_is_active then 'service.deactivated' else 'service.updated' end,'service',result_id,'success',jsonb_build_object('active',service_is_active));
  end if;
  return result_id;
end $$;

create function public.create_proposal(target_client_id uuid, target_opportunity_id uuid, proposal_title text, proposal_valid_until date default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare membership public.organization_members; sequence_number integer; proposal_year integer; result_id uuid; result_number text; linked_client uuid;
begin
  select * into membership from private.current_proposals_membership('proposals.write');
  if membership.id is null then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
  if char_length(btrim(proposal_title)) not between 2 and 160 then raise exception using errcode='23514',message='Proposal title is invalid.'; end if;
  perform 1 from public.clients where id=target_client_id and organization_id=membership.organization_id and state='active';
  if not found then raise exception using errcode='P0002',message='Client not available.'; end if;
  if target_opportunity_id is not null then
    select client_id into linked_client from public.client_opportunities where opportunity_id=target_opportunity_id and organization_id=membership.organization_id;
    if linked_client is distinct from target_client_id then raise exception using errcode='23514',message='Opportunity is not linked to the selected client.'; end if;
  end if;
  proposal_year := extract(year from current_date)::integer;
  insert into public.proposal_counters(organization_id,proposal_year,last_number) values(membership.organization_id,proposal_year,1)
  on conflict(organization_id,proposal_year) do update set last_number=public.proposal_counters.last_number+1 returning last_number into sequence_number;
  result_number := 'DEV-'||proposal_year::text||'-'||lpad(sequence_number::text,4,'0');
  insert into public.proposals(organization_id,proposal_number,client_id,opportunity_id,title,valid_until,created_by)
  values(membership.organization_id,result_number,target_client_id,target_opportunity_id,btrim(proposal_title),proposal_valid_until,auth.uid()) returning id into result_id;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(membership.organization_id,auth.uid(),'proposal.created','proposal',result_id,'success',jsonb_build_object('has_opportunity',target_opportunity_id is not null));
  return jsonb_build_object('id',result_id,'proposalNumber',result_number);
end $$;

create function public.update_proposal(target_proposal_id uuid, proposal_title text, proposal_valid_until date, proposal_discount_amount numeric)
returns integer language plpgsql security definer set search_path = '' as $$
declare item public.proposals;
begin
  select * into item from private.assert_draft_proposal(target_proposal_id);
  if char_length(btrim(proposal_title)) not between 2 and 160 or proposal_discount_amount < 0 or proposal_discount_amount > item.subtotal then raise exception using errcode='23514',message='Proposal data is invalid.'; end if;
  update public.proposals set title=btrim(proposal_title),valid_until=proposal_valid_until,discount_amount=proposal_discount_amount,total_amount=subtotal-proposal_discount_amount,updated_by=auth.uid(),updated_at=now(),version=version+1 where id=item.id;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(item.organization_id,auth.uid(),'proposal.updated','proposal',item.id,'success',jsonb_build_object('version',item.version+1));
  return item.version+1;
end $$;

create function public.upsert_proposal_item(target_item_id uuid, target_proposal_id uuid, target_service_id uuid, item_name text, item_description text, item_quantity numeric, item_unit public.service_unit, item_unit_price numeric)
returns uuid language plpgsql security definer set search_path = '' as $$
declare proposal public.proposals; service public.services; result_id uuid; next_position integer; action text;
begin
  select * into proposal from private.assert_draft_proposal(target_proposal_id);
  if target_service_id is not null then select * into service from public.services where id=target_service_id and organization_id=proposal.organization_id and is_active; if service.id is null then raise exception using errcode='P0002',message='Service not available.'; end if; end if;
  if target_item_id is null and target_service_id is not null then item_name:=service.name; item_description:=service.description; item_unit:=service.default_unit; item_unit_price:=service.default_price; end if;
  if char_length(btrim(item_name)) not between 2 and 160 or item_quantity<=0 or item_quantity>999999999.999 or item_unit_price<0 or item_unit_price>999999999999.99 then raise exception using errcode='23514',message='Proposal item data is invalid.'; end if;
  if round(item_quantity*item_unit_price,2)>999999999999.99 then raise exception using errcode='22003',message='Proposal item total is too large.'; end if;
  if target_item_id is null then
    select coalesce(max(position),0)+1 into next_position from public.proposal_items where proposal_id=proposal.id;
    insert into public.proposal_items(organization_id,proposal_id,service_id,position,name,description,quantity,unit,unit_price) values(proposal.organization_id,proposal.id,target_service_id,next_position,btrim(item_name),nullif(btrim(item_description),''),item_quantity,item_unit,item_unit_price) returning id into result_id; action:='proposal_item.created';
  else
    update public.proposal_items set name=btrim(item_name),description=nullif(btrim(item_description),''),quantity=item_quantity,unit=item_unit,unit_price=item_unit_price,updated_at=now() where id=target_item_id and proposal_id=proposal.id returning id into result_id;
    if result_id is null then raise exception using errcode='P0002',message='Proposal item not available.'; end if; action:='proposal_item.updated';
  end if;
  perform private.recalculate_proposal(proposal.id);
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(proposal.organization_id,auth.uid(),action,'proposal_item',result_id,'success',jsonb_build_object('proposal_id',proposal.id,'catalog_item',target_service_id is not null));
  return result_id;
end $$;

create function public.remove_proposal_item(target_item_id uuid, target_proposal_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare proposal public.proposals; removed_position integer;
begin
  select * into proposal from private.assert_draft_proposal(target_proposal_id);
  delete from public.proposal_items where id=target_item_id and proposal_id=proposal.id returning position into removed_position;
  if removed_position is null then raise exception using errcode='P0002',message='Proposal item not available.'; end if;
  update public.proposal_items set position=position-1,updated_at=now() where proposal_id=proposal.id and position>removed_position;
  perform private.recalculate_proposal(proposal.id);
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(proposal.organization_id,auth.uid(),'proposal_item.removed','proposal_item',target_item_id,'success',jsonb_build_object('proposal_id',proposal.id));
end $$;

create function public.move_proposal_item(target_item_id uuid, target_proposal_id uuid, direction text)
returns void language plpgsql security definer set search_path = '' as $$
declare proposal public.proposals; current_position integer; swap_position integer; swap_id uuid;
begin
  select * into proposal from private.assert_draft_proposal(target_proposal_id);
  if direction not in ('up','down') then raise exception using errcode='22023',message='Invalid move direction.'; end if;
  select position into current_position from public.proposal_items where id=target_item_id and proposal_id=proposal.id for update;
  if current_position is null then raise exception using errcode='P0002',message='Proposal item not available.'; end if;
  swap_position:=current_position+case direction when 'up' then -1 else 1 end;
  select id into swap_id from public.proposal_items where proposal_id=proposal.id and position=swap_position for update;
  if swap_id is null then return; end if;
  update public.proposal_items set position=2147483647 where id=target_item_id;
  update public.proposal_items set position=current_position where id=swap_id;
  update public.proposal_items set position=swap_position where id=target_item_id;
  update public.proposals set updated_by=auth.uid(),updated_at=now(),version=version+1 where id=proposal.id;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(proposal.organization_id,auth.uid(),'proposal_item.reordered','proposal_item',target_item_id,'success',jsonb_build_object('proposal_id',proposal.id,'direction',direction));
end $$;

alter table public.services enable row level security;
alter table public.proposal_counters enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;
create policy "members read proposal services" on public.services for select to authenticated using ((select private.has_permission('proposals.read',organization_id)));
create policy "members read proposals" on public.proposals for select to authenticated using ((select private.has_permission('proposals.read',organization_id)));
create policy "members read proposal items" on public.proposal_items for select to authenticated using ((select private.has_permission('proposals.read',organization_id)));

revoke all on table public.services,public.proposal_counters,public.proposals,public.proposal_items from public,anon,authenticated,service_role;
grant select on table public.services,public.proposals,public.proposal_items to authenticated;
revoke all on function private.current_proposals_membership(text),private.assert_draft_proposal(uuid),private.recalculate_proposal(uuid),public.upsert_service(uuid,text,text,public.service_unit,numeric,boolean),public.create_proposal(uuid,uuid,text,date),public.update_proposal(uuid,text,date,numeric),public.upsert_proposal_item(uuid,uuid,uuid,text,text,numeric,public.service_unit,numeric),public.remove_proposal_item(uuid,uuid),public.move_proposal_item(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.upsert_service(uuid,text,text,public.service_unit,numeric,boolean),public.create_proposal(uuid,uuid,text,date),public.update_proposal(uuid,text,date,numeric),public.upsert_proposal_item(uuid,uuid,uuid,text,text,numeric,public.service_unit,numeric),public.remove_proposal_item(uuid,uuid),public.move_proposal_item(uuid,uuid,text) to authenticated;

alter table public.audit_logs drop constraint audit_logs_action_catalog;
alter table public.audit_logs add constraint audit_logs_action_catalog check(action=any(array[
'auth.login.succeeded','auth.login.failed','auth.logout.succeeded','auth.password_reset.requested','auth.password_reset.completed','auth.invitation.created','auth.invitation.accepted','auth.invitation.failed','auth.mfa.enrollment_started','auth.mfa.enrollment_completed','auth.mfa.challenge.succeeded','auth.mfa.challenge.failed','auth.mfa.factor_added','auth.mfa.factor_removed','auth.access.denied','member.invited','member.activated','member.suspended','member.reactivated','member.role.assigned','member.role.removed','permission.assignment.denied','administrator.bootstrap.completed',
'crm.lead.created','crm.lead.updated','crm.lead.assigned','crm.lead.triage_changed','crm.lead.archived','crm.lead.reactivated','crm.company.created','crm.company.updated','crm.company.archived','crm.company.reactivated','crm.contact.created','crm.contact.updated','crm.contact.archived','crm.contact.reactivated','crm.opportunity.created','crm.opportunity.updated','crm.opportunity.assigned','crm.opportunity.stage_changed','crm.opportunity.won','crm.opportunity.lost','crm.opportunity.reopened','crm.opportunity.archived','crm.activity.created','crm.task.created','crm.task.updated','crm.task.assigned','crm.task.completed','crm.task.cancelled','crm.task.reopened','crm.client.created','crm.opportunity.converted',
'service.created','service.updated','service.deactivated','proposal.created','proposal.updated','proposal_item.created','proposal_item.updated','proposal_item.removed','proposal_item.reordered'
]));

comment on table public.services is 'Tenant-scoped reusable commercial service defaults; historical proposal snapshots are independent.';
comment on table public.proposals is 'Structured commercial proposals; D1 permits mutations only while draft.';
comment on table public.proposal_items is 'Immutable-at-creation catalog snapshot fields that remain editable only in draft proposals.';

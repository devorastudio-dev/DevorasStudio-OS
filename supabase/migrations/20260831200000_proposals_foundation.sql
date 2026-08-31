create type public.service_unit as enum ('project','hour','month','unit','custom');
create type public.proposal_status as enum ('draft');

insert into public.permissions(key,description) values ('proposals.write','Criar e editar propostas e catalogo de servicos.') on conflict(key) do update set description=excluded.description;
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r join public.permissions p on p.key='proposals.write'
where r.slug in('administrador','socio','colaborador') on conflict do nothing;

create or replace function private.seed_system_roles(target_organization_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.roles(organization_id,name,slug,description,is_system) values
    (target_organization_id,'Administrador','administrador','Administracao completa da organizacao.',true),
    (target_organization_id,'Socio','socio','Gestao comercial e operacional ampla.',true),
    (target_organization_id,'Colaborador','colaborador','Operacao cotidiana sem administracao ou financeiro global.',true),
    (target_organization_id,'Financeiro','financeiro','Operacao financeira sem administracao de acessos.',true)
  on conflict(organization_id,slug) do nothing;
  insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r cross join public.permissions p where r.organization_id=target_organization_id and r.slug='administrador' on conflict do nothing;
  insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.key=any(array[
    'organization.read','members.read','members.invite','roles.read','crm.read','crm.write','clients.read','clients.write','proposals.read','proposals.create','proposals.write','proposals.approve','projects.read','projects.write','financial.read','financial.write','products.read','products.write'
  ]) where r.organization_id=target_organization_id and r.slug='socio' on conflict do nothing;
  insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.key=any(array[
    'organization.read','members.read','crm.read','crm.write','clients.read','clients.write','proposals.read','proposals.create','proposals.write','projects.read','projects.write','products.read'
  ]) where r.organization_id=target_organization_id and r.slug='colaborador' on conflict do nothing;
  insert into public.role_permissions(role_id,permission_id) select r.id,p.id from public.roles r join public.permissions p on p.key=any(array[
    'organization.read','clients.read','financial.read','financial.write'
  ]) where r.organization_id=target_organization_id and r.slug='financeiro' on conflict do nothing;
end $$;

create table public.services(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 name text not null check(char_length(btrim(name)) between 2 and 160), description text check(description is null or char_length(description)<=2000),
 default_unit public.service_unit not null, default_price numeric(14,2) not null default 0 check(default_price>=0),
 is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null references public.profiles(id) on delete restrict, updated_by uuid references public.profiles(id) on delete set null,
 constraint services_id_organization_key unique(id,organization_id), constraint services_name_key unique(organization_id,name)
);
create index services_active_name_idx on public.services(organization_id,is_active,name);

create table private.proposal_number_counters(
 organization_id uuid not null references public.organizations(id) on delete cascade, proposal_year integer not null check(proposal_year between 2020 and 9999),
 last_value integer not null check(last_value>0), primary key(organization_id,proposal_year)
);

create table public.proposals(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 proposal_number text not null check(proposal_number ~ '^DEV-[0-9]{4}-[0-9]{4,}$'), client_id uuid not null, opportunity_id uuid,
 title text not null check(char_length(btrim(title)) between 2 and 160), status public.proposal_status not null default 'draft',
 valid_until date, currency text not null default 'BRL' check(currency='BRL'), subtotal numeric(14,2) not null default 0 check(subtotal>=0),
 discount_amount numeric(14,2) not null default 0 check(discount_amount>=0 and discount_amount<=subtotal),
 total_amount numeric(14,2) not null default 0 check(total_amount>=0 and total_amount=subtotal-discount_amount),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references public.profiles(id) on delete restrict,
 updated_by uuid references public.profiles(id) on delete set null, version integer not null default 1 check(version>0),
 constraint proposals_id_organization_key unique(id,organization_id), constraint proposals_number_key unique(organization_id,proposal_number),
 constraint proposals_client_fk foreign key(client_id,organization_id) references public.clients(id,organization_id) on delete restrict,
 constraint proposals_opportunity_fk foreign key(opportunity_id,organization_id) references public.opportunities(id,organization_id) on delete restrict
);
create index proposals_org_created_idx on public.proposals(organization_id,created_at desc);
create index proposals_client_idx on public.proposals(organization_id,client_id);
create index proposals_opportunity_idx on public.proposals(organization_id,opportunity_id) where opportunity_id is not null;
create index proposals_status_idx on public.proposals(organization_id,status);
create index proposals_valid_until_idx on public.proposals(organization_id,valid_until) where valid_until is not null;

create table public.proposal_items(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, proposal_id uuid not null, service_id uuid,
 position integer not null check(position>0), name text not null check(char_length(btrim(name)) between 2 and 160),
 description text check(description is null or char_length(description)<=2000), quantity numeric(12,3) not null check(quantity>0 and quantity<=999999),
 unit public.service_unit not null, unit_price numeric(14,2) not null check(unit_price>=0),
 line_total numeric(14,2) generated always as (round(quantity*unit_price,2)) stored,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint proposal_items_id_organization_key unique(id,organization_id), constraint proposal_items_position_key unique(proposal_id,position),
 constraint proposal_items_proposal_fk foreign key(proposal_id,organization_id) references public.proposals(id,organization_id) on delete cascade,
 constraint proposal_items_service_fk foreign key(service_id,organization_id) references public.services(id,organization_id) on delete restrict
);
create index proposal_items_proposal_idx on public.proposal_items(organization_id,proposal_id,position);
create index proposal_items_service_idx on public.proposal_items(organization_id,service_id) where service_id is not null;
alter table public.proposal_items drop constraint proposal_items_position_key;
alter table public.proposal_items add constraint proposal_items_position_key unique(proposal_id,position) deferrable initially deferred;

create function private.recalculate_proposal(target_proposal_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare calculated numeric(14,2);
begin
 select coalesce(sum(i.line_total),0) into calculated from public.proposal_items i where i.proposal_id=target_proposal_id;
 update public.proposals set subtotal=calculated,discount_amount=least(discount_amount,calculated),total_amount=calculated-least(discount_amount,calculated),updated_at=now(),version=version+1 where id=target_proposal_id;
end $$;
create function private.recalculate_proposal_trigger() returns trigger language plpgsql security definer set search_path='' as $$
begin perform private.recalculate_proposal(coalesce(new.proposal_id,old.proposal_id)); return coalesce(new,old); end $$;
create trigger proposal_items_recalculate after insert or update or delete on public.proposal_items for each row execute function private.recalculate_proposal_trigger();

create function public.create_service(service_name text,service_description text,service_unit public.service_unit,service_price numeric)
returns uuid language plpgsql security definer set search_path='' as $$
declare m public.organization_members; result uuid;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 insert into public.services(organization_id,name,description,default_unit,default_price,created_by) values(m.organization_id,btrim(service_name),nullif(btrim(service_description),''),service_unit,service_price,auth.uid()) returning id into result;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.service.created','service',result,'success','{}'); return result; end $$;

create function public.update_service(target_service_id uuid,service_name text,service_description text,service_unit public.service_unit,service_price numeric,target_active boolean)
returns void language plpgsql security definer set search_path='' as $$
declare m public.organization_members; affected integer;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 update public.services set name=btrim(service_name),description=nullif(btrim(service_description),''),default_unit=service_unit,default_price=service_price,is_active=target_active,updated_at=now(),updated_by=auth.uid() where id=target_service_id and organization_id=m.organization_id; get diagnostics affected=row_count; if affected=0 then raise exception using errcode='P0002',message='Service not available.'; end if;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),case when target_active then 'proposal.service.updated' else 'proposal.service.deactivated' end,'service',target_service_id,'success',jsonb_build_object('active',target_active)); end $$;

create function public.create_proposal(target_client_id uuid,target_opportunity_id uuid default null,proposal_title text default null,proposal_valid_until date default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare m public.organization_members; counter integer; yr integer:=extract(year from current_date); num text; result uuid;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 if not exists(select 1 from public.clients c where c.id=target_client_id and c.organization_id=m.organization_id and c.state='active') then raise exception using errcode='23503',message='Client not available.'; end if;
 if target_opportunity_id is not null and not exists(select 1 from public.client_opportunities co where co.client_id=target_client_id and co.opportunity_id=target_opportunity_id and co.organization_id=m.organization_id) then raise exception using errcode='23503',message='Opportunity is not linked to client.'; end if;
 insert into private.proposal_number_counters(organization_id,proposal_year,last_value) values(m.organization_id,yr,1) on conflict(organization_id,proposal_year) do update set last_value=private.proposal_number_counters.last_value+1 returning last_value into counter;
 num:='DEV-'||yr||'-'||lpad(counter::text,4,'0');
 insert into public.proposals(organization_id,proposal_number,client_id,opportunity_id,title,valid_until,created_by) values(m.organization_id,num,target_client_id,target_opportunity_id,btrim(proposal_title),proposal_valid_until,auth.uid()) returning id into result;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.record.created','proposal',result,'success',jsonb_build_object('status','draft')); return result; end $$;

create function public.update_proposal(target_proposal_id uuid,proposal_title text default null,proposal_valid_until date default null,proposal_discount numeric default 0)
returns void language plpgsql security definer set search_path='' as $$
declare m public.organization_members; item public.proposals%rowtype;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 select * into item from public.proposals where id=target_proposal_id and organization_id=m.organization_id for update; if item.id is null then raise exception using errcode='P0002',message='Proposal not available.'; end if; if item.status<>'draft' then raise exception using errcode='23514',message='Proposal is not editable.'; end if; if proposal_discount<0 or proposal_discount>item.subtotal then raise exception using errcode='23514',message='Invalid proposal discount.'; end if;
 update public.proposals set title=btrim(proposal_title),valid_until=proposal_valid_until,discount_amount=proposal_discount,total_amount=subtotal-proposal_discount,updated_at=now(),updated_by=auth.uid(),version=version+1 where id=item.id;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.record.updated','proposal',item.id,'success',jsonb_build_object('status','draft')); end $$;

create function public.save_proposal_item(target_proposal_id uuid,target_item_id uuid default null,target_service_id uuid default null,item_name text default null,item_description text default null,item_quantity numeric default 1,item_unit public.service_unit default null,item_unit_price numeric default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare m public.organization_members; proposal public.proposals%rowtype; service public.services%rowtype; result uuid; next_position integer;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 select * into proposal from public.proposals where id=target_proposal_id and organization_id=m.organization_id for update; if proposal.id is null or proposal.status<>'draft' then raise exception using errcode='23514',message='Proposal is not editable.'; end if;
 if target_service_id is not null then select * into service from public.services where id=target_service_id and organization_id=m.organization_id; if service.id is null then raise exception using errcode='23503',message='Service not available.'; end if; end if;
 if target_item_id is null then select coalesce(max(position),0)+1 into next_position from public.proposal_items where proposal_id=proposal.id;
  insert into public.proposal_items(organization_id,proposal_id,service_id,position,name,description,quantity,unit,unit_price) values(m.organization_id,proposal.id,target_service_id,next_position,coalesce(nullif(btrim(item_name),''),service.name),coalesce(nullif(btrim(item_description),''),service.description),item_quantity,coalesce(item_unit,service.default_unit),coalesce(item_unit_price,service.default_price)) returning id into result;
 else update public.proposal_items set name=btrim(item_name),description=nullif(btrim(item_description),''),quantity=item_quantity,unit=item_unit,unit_price=item_unit_price,updated_at=now() where id=target_item_id and proposal_id=proposal.id and organization_id=m.organization_id returning id into result; if result is null then raise exception using errcode='P0002',message='Proposal item not available.'; end if; end if;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),case when target_item_id is null then 'proposal.item.created' else 'proposal.item.updated' end,'proposal_item',result,'success',jsonb_build_object('proposal_id',proposal.id,'catalog',target_service_id is not null)); return result; end $$;

create function public.remove_proposal_item(target_item_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare m public.organization_members; item public.proposal_items%rowtype; proposal public.proposals%rowtype;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 select * into item from public.proposal_items where id=target_item_id and organization_id=m.organization_id; select * into proposal from public.proposals where id=item.proposal_id and organization_id=m.organization_id for update; if item.id is null or proposal.status<>'draft' then raise exception using errcode='23514',message='Proposal is not editable.'; end if;
 delete from public.proposal_items where id=item.id; update public.proposal_items set position=position-1 where proposal_id=proposal.id and position>item.position;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.item.removed','proposal_item',item.id,'success',jsonb_build_object('proposal_id',proposal.id)); end $$;

create function public.move_proposal_item(target_item_id uuid,direction integer) returns void language plpgsql security definer set search_path='' as $$
declare m public.organization_members; item public.proposal_items%rowtype; adjacent public.proposal_items%rowtype; proposal public.proposals%rowtype;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 if direction not in(-1,1) then raise exception using errcode='22023',message='Invalid movement.'; end if;
 select * into item from public.proposal_items where id=target_item_id and organization_id=m.organization_id for update;
 select * into proposal from public.proposals where id=item.proposal_id and organization_id=m.organization_id for update;
 if item.id is null or proposal.status<>'draft' then raise exception using errcode='23514',message='Proposal is not editable.'; end if;
 select * into adjacent from public.proposal_items where proposal_id=item.proposal_id and position=item.position+direction for update;
 if adjacent.id is null then return; end if;
 set constraints public.proposal_items_position_key deferred;
 update public.proposal_items set position=adjacent.position,updated_at=now() where id=item.id;
 update public.proposal_items set position=item.position,updated_at=now() where id=adjacent.id;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.item.reordered','proposal_item',item.id,'success',jsonb_build_object('proposal_id',proposal.id,'direction',direction));
end $$;

alter table public.services enable row level security; alter table public.proposals enable row level security; alter table public.proposal_items enable row level security;
create policy "proposal readers read services" on public.services for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
create policy "proposal readers read proposals" on public.proposals for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
create policy "proposal readers read items" on public.proposal_items for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
revoke all on table public.services,public.proposals,public.proposal_items from public,anon,authenticated,service_role;
grant select on table public.services,public.proposals,public.proposal_items to authenticated;
revoke all on function private.recalculate_proposal(uuid),private.recalculate_proposal_trigger(),public.create_service(text,text,public.service_unit,numeric),public.update_service(uuid,text,text,public.service_unit,numeric,boolean),public.create_proposal(uuid,uuid,text,date),public.update_proposal(uuid,text,date,numeric),public.save_proposal_item(uuid,uuid,uuid,text,text,numeric,public.service_unit,numeric),public.remove_proposal_item(uuid),public.move_proposal_item(uuid,integer) from public,anon,authenticated,service_role;
grant execute on function public.create_service(text,text,public.service_unit,numeric),public.update_service(uuid,text,text,public.service_unit,numeric,boolean),public.create_proposal(uuid,uuid,text,date),public.update_proposal(uuid,text,date,numeric),public.save_proposal_item(uuid,uuid,uuid,text,text,numeric,public.service_unit,numeric),public.remove_proposal_item(uuid),public.move_proposal_item(uuid,integer) to authenticated;

alter table public.audit_logs drop constraint audit_logs_action_catalog;
alter table public.audit_logs add constraint audit_logs_action_catalog check(action=any(array[
'auth.login.succeeded','auth.login.failed','auth.logout.succeeded','auth.password_reset.requested','auth.password_reset.completed','auth.invitation.created','auth.invitation.accepted','auth.invitation.failed','auth.mfa.enrollment_started','auth.mfa.enrollment_completed','auth.mfa.challenge.succeeded','auth.mfa.challenge.failed','auth.mfa.factor_added','auth.mfa.factor_removed','auth.access.denied','member.invited','member.activated','member.suspended','member.reactivated','member.role.assigned','member.role.removed','permission.assignment.denied','administrator.bootstrap.completed',
'crm.lead.created','crm.lead.updated','crm.lead.assigned','crm.lead.triage_changed','crm.lead.archived','crm.lead.reactivated','crm.company.created','crm.company.updated','crm.company.archived','crm.company.reactivated','crm.contact.created','crm.contact.updated','crm.contact.archived','crm.contact.reactivated','crm.opportunity.created','crm.opportunity.updated','crm.opportunity.assigned','crm.opportunity.stage_changed','crm.opportunity.won','crm.opportunity.lost','crm.opportunity.reopened','crm.opportunity.archived','crm.activity.created','crm.task.created','crm.task.updated','crm.task.assigned','crm.task.completed','crm.task.cancelled','crm.task.reopened','crm.client.created','crm.opportunity.converted',
'proposal.service.created','proposal.service.updated','proposal.service.deactivated','proposal.record.created','proposal.record.updated','proposal.item.created','proposal.item.updated','proposal.item.removed','proposal.item.reordered'
]));

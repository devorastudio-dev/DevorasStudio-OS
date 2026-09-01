-- D3: tenant-aware proposal templates and immutable proposal snapshots.
alter table public.proposals
  add column source_template_id uuid,
  add column source_template_version integer;

create table public.proposal_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  description text check (description is null or char_length(description) <= 500),
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid references public.profiles(id) on delete set null,
  constraint proposal_templates_id_org_key unique(id, organization_id),
  constraint proposal_templates_name_key unique(organization_id, name)
);

create table public.proposal_template_sections (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null,
  template_id uuid not null, section_type public.proposal_section_type not null,
  title text not null check(char_length(btrim(title)) between 1 and 120),
  content text not null default '' check(char_length(content) <= 12000),
  position integer not null check(position between 1 and 100), is_visible boolean not null default true,
  constraint proposal_template_sections_template_fk foreign key(template_id,organization_id) references public.proposal_templates(id,organization_id) on delete cascade,
  constraint proposal_template_sections_position_key unique(template_id,position) deferrable initially deferred
);

create table public.proposal_template_items (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null,
  template_id uuid not null, service_id uuid, position integer not null check(position between 1 and 100),
  name text not null check(char_length(btrim(name)) between 2 and 160),
  description text check(description is null or char_length(description)<=2000),
  quantity numeric(12,3) not null check(quantity>0), unit public.service_unit not null,
  unit_price numeric(14,2) not null check(unit_price>=0),
  constraint proposal_template_items_template_fk foreign key(template_id,organization_id) references public.proposal_templates(id,organization_id) on delete cascade,
  constraint proposal_template_items_service_fk foreign key(service_id,organization_id) references public.services(id,organization_id) on delete restrict,
  constraint proposal_template_items_position_key unique(template_id,position) deferrable initially deferred
);

create table public.proposal_template_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null,
  template_id uuid not null, version_number integer not null check(version_number>0),
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object'), request_key uuid not null,
  created_at timestamptz not null default now(), created_by uuid not null references public.profiles(id) on delete restrict,
  constraint proposal_template_versions_template_fk foreign key(template_id,organization_id) references public.proposal_templates(id,organization_id) on delete restrict,
  constraint proposal_template_versions_number_key unique(template_id,version_number),
  constraint proposal_template_versions_request_key unique(template_id,request_key)
);

create table public.proposal_versions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null,
  proposal_id uuid not null, version_number integer not null check(version_number>0),
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object'), request_key uuid not null,
  created_at timestamptz not null default now(), created_by uuid not null references public.profiles(id) on delete restrict,
  constraint proposal_versions_proposal_fk foreign key(proposal_id,organization_id) references public.proposals(id,organization_id) on delete restrict,
  constraint proposal_versions_number_key unique(proposal_id,version_number),
  constraint proposal_versions_request_key unique(proposal_id,request_key)
);

alter table public.proposals add constraint proposals_source_template_fk
  foreign key(source_template_id,organization_id) references public.proposal_templates(id,organization_id) on delete restrict;
create index proposal_templates_org_active_idx on public.proposal_templates(organization_id,is_active,name);
create index proposal_template_versions_idx on public.proposal_template_versions(organization_id,template_id,version_number desc);
create index proposal_versions_idx on public.proposal_versions(organization_id,proposal_id,version_number desc);

create function private.proposal_template_snapshot(target_template_id uuid) returns jsonb
language sql security definer set search_path='' as $$
 select jsonb_build_object('template',jsonb_build_object('id',t.id,'name',t.name,'description',t.description),
  'sections',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'type',s.section_type,'title',s.title,'content',s.content,'position',s.position,'visible',s.is_visible) order by s.position) from public.proposal_template_sections s where s.template_id=t.id),'[]'::jsonb),
  'items',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'serviceId',i.service_id,'name',i.name,'description',i.description,'quantity',i.quantity,'unit',i.unit,'unitPrice',i.unit_price,'total',round(i.quantity*i.unit_price,2)) order by i.position) from public.proposal_template_items i where i.template_id=t.id),'[]'::jsonb))
 from public.proposal_templates t where t.id=target_template_id
$$;

create function public.create_proposal_template(template_name text,template_description text default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare m public.organization_members; result uuid;
begin select * into m from private.current_crm_membership();
 if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 insert into public.proposal_templates(organization_id,name,description,created_by) values(m.organization_id,btrim(template_name),nullif(btrim(template_description),''),auth.uid()) returning id into result;
 insert into public.proposal_template_sections(organization_id,template_id,section_type,title,position) values
 (m.organization_id,result,'introduction','Apresentação',1),(m.organization_id,result,'objective','Objetivo',2),(m.organization_id,result,'scope','Escopo',3),(m.organization_id,result,'deliverables','Entregáveis',4),(m.organization_id,result,'commercial_terms','Condições comerciais',5),(m.organization_id,result,'closing','Encerramento',6);
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.template.created','proposal_template',result,'success','{}'); return result;
end $$;

create function public.update_proposal_template(target_template_id uuid,template_name text,template_description text,target_active boolean) returns void
language plpgsql security definer set search_path='' as $$
declare m public.organization_members; affected integer;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 update public.proposal_templates set name=btrim(template_name),description=nullif(btrim(template_description),''),is_active=target_active,updated_at=now(),updated_by=auth.uid() where id=target_template_id and organization_id=m.organization_id; get diagnostics affected=row_count;
 if affected=0 then raise exception using errcode='P0002',message='Template not available.'; end if;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),case when target_active then 'proposal.template.updated' else 'proposal.template.deactivated' end,'proposal_template',target_template_id,'success',jsonb_build_object('active',target_active));
end $$;

create function public.save_proposal_template_section(target_template_id uuid,target_section_id uuid,section_type public.proposal_section_type,section_title text,section_content text,target_visible boolean) returns uuid
language plpgsql security definer set search_path='' as $$
declare m public.organization_members; result uuid; next_position integer;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 perform 1 from public.proposal_templates where id=target_template_id and organization_id=m.organization_id for update; if not found then raise exception using errcode='P0002',message='Template not available.'; end if;
 if target_section_id is null then select coalesce(max(position),0)+1 into next_position from public.proposal_template_sections where template_id=target_template_id; insert into public.proposal_template_sections(organization_id,template_id,section_type,title,content,position,is_visible) values(m.organization_id,target_template_id,section_type,btrim(section_title),coalesce(section_content,''),next_position,target_visible) returning id into result;
 else update public.proposal_template_sections set title=btrim(section_title),content=coalesce(section_content,''),is_visible=target_visible where id=target_section_id and template_id=target_template_id and organization_id=m.organization_id returning id into result; end if;
 if result is null then raise exception using errcode='P0002',message='Template section not available.'; end if; return result;
end $$;

create function public.save_proposal_template_item(target_template_id uuid,target_item_id uuid,target_service_id uuid,item_name text,item_description text,item_quantity numeric,item_unit public.service_unit,item_unit_price numeric) returns uuid
language plpgsql security definer set search_path='' as $$
declare m public.organization_members; result uuid; next_position integer; svc public.services%rowtype;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 perform 1 from public.proposal_templates where id=target_template_id and organization_id=m.organization_id for update; if not found then raise exception using errcode='P0002',message='Template not available.'; end if;
 if target_service_id is not null then select * into svc from public.services where id=target_service_id and organization_id=m.organization_id; if svc.id is null then raise exception using errcode='23503',message='Service not available.'; end if; end if;
 if target_item_id is null then select coalesce(max(position),0)+1 into next_position from public.proposal_template_items where template_id=target_template_id; insert into public.proposal_template_items(organization_id,template_id,service_id,position,name,description,quantity,unit,unit_price) values(m.organization_id,target_template_id,target_service_id,next_position,coalesce(nullif(btrim(item_name),''),svc.name),coalesce(nullif(btrim(item_description),''),svc.description),item_quantity,coalesce(item_unit,svc.default_unit),coalesce(item_unit_price,svc.default_price)) returning id into result;
 else update public.proposal_template_items set name=btrim(item_name),description=nullif(btrim(item_description),''),quantity=item_quantity,unit=item_unit,unit_price=item_unit_price where id=target_item_id and template_id=target_template_id and organization_id=m.organization_id returning id into result; end if;
 if result is null then raise exception using errcode='P0002',message='Template item not available.'; end if; return result;
end $$;

create function public.create_proposal_template_version(target_template_id uuid,target_request_key uuid) returns integer
language plpgsql security definer set search_path='' as $$
declare m public.organization_members; next_version integer; existing integer;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 select version_number into existing from public.proposal_template_versions where template_id=target_template_id and request_key=target_request_key; if existing is not null then return existing; end if;
 perform 1 from public.proposal_templates where id=target_template_id and organization_id=m.organization_id for update; if not found then raise exception using errcode='P0002',message='Template not available.'; end if;
 select coalesce(max(version_number),0)+1 into next_version from public.proposal_template_versions where template_id=target_template_id;
 insert into public.proposal_template_versions(organization_id,template_id,version_number,snapshot,request_key,created_by) values(m.organization_id,target_template_id,next_version,private.proposal_template_snapshot(target_template_id),target_request_key,auth.uid());
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.template.version.created','proposal_template',target_template_id,'success',jsonb_build_object('version',next_version)); return next_version;
end $$;

create function public.create_proposal_from_template(target_client_id uuid,target_opportunity_id uuid,proposal_title text,proposal_valid_until date,target_template_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare result uuid; m public.organization_members; t public.proposal_templates%rowtype; tv integer;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 select * into t from public.proposal_templates where id=target_template_id and organization_id=m.organization_id and is_active for share; if t.id is null then raise exception using errcode='P0002',message='Template not available.'; end if;
 result:=public.create_proposal(target_client_id,target_opportunity_id,proposal_title,proposal_valid_until);
 delete from public.proposal_sections where proposal_id=result;
 insert into public.proposal_sections(organization_id,proposal_id,section_type,title,content,position,is_visible,created_by) select m.organization_id,result,section_type,title,content,position,is_visible,auth.uid() from public.proposal_template_sections where template_id=t.id;
 insert into public.proposal_items(organization_id,proposal_id,service_id,position,name,description,quantity,unit,unit_price) select m.organization_id,result,service_id,position,name,description,quantity,unit,unit_price from public.proposal_template_items where template_id=t.id;
 select max(version_number) into tv from public.proposal_template_versions where template_id=t.id;
 update public.proposals set source_template_id=t.id,source_template_version=tv where id=result;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.created.from_template','proposal',result,'success',jsonb_build_object('template_id',t.id,'template_version',tv)); return result;
end $$;

create function public.create_proposal_version(target_proposal_id uuid,target_request_key uuid) returns integer
language plpgsql security definer set search_path='' as $$
declare m public.organization_members; p public.proposals%rowtype; next_version integer; existing integer; client_name text; settings public.organization_document_settings%rowtype; snap jsonb;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 select version_number into existing from public.proposal_versions where proposal_id=target_proposal_id and request_key=target_request_key; if existing is not null then return existing; end if;
 select * into p from public.proposals where id=target_proposal_id and organization_id=m.organization_id for update; if p.id is null then raise exception using errcode='P0002',message='Proposal not available.'; end if;
 select coalesce(cc.display_name,ct.full_name,l.full_name,'Cliente') into client_name from public.clients c left join public.crm_companies cc on cc.id=c.company_id left join public.crm_contacts ct on ct.id=c.primary_contact_id left join public.leads l on l.id=c.source_lead_id where c.id=p.client_id;
 select * into settings from public.organization_document_settings where organization_id=m.organization_id;
 snap:=jsonb_build_object('proposal',jsonb_build_object('number',p.proposal_number,'title',p.title,'createdAt',p.created_at,'validUntil',p.valid_until,'subtotal',p.subtotal,'discount',p.discount_amount,'total',p.total_amount,'sourceTemplateId',p.source_template_id,'sourceTemplateVersion',p.source_template_version),
  'organization',jsonb_build_object('name',coalesce(settings.display_name,(select o.name from public.organizations o where o.id=m.organization_id)),'email',settings.email,'phone',settings.phone,'website',settings.website,'city',settings.city,'logoPath',settings.logo_path),
  'client',jsonb_build_object('name',client_name),
  'sections',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'content',s.content,'type',s.section_type,'visible',s.is_visible,'position',s.position) order by s.position) from public.proposal_sections s where s.proposal_id=p.id),'[]'::jsonb),
  'items',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'name',i.name,'description',i.description,'quantity',i.quantity,'unit',i.unit,'unitPrice',i.unit_price,'total',i.line_total) order by i.position) from public.proposal_items i where i.proposal_id=p.id),'[]'::jsonb));
 select coalesce(max(version_number),0)+1 into next_version from public.proposal_versions where proposal_id=p.id;
 insert into public.proposal_versions(organization_id,proposal_id,version_number,snapshot,request_key,created_by) values(m.organization_id,p.id,next_version,snap,target_request_key,auth.uid());
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.version.created','proposal',p.id,'success',jsonb_build_object('version',next_version)); return next_version;
end $$;

alter table public.proposal_templates enable row level security;
alter table public.proposal_template_sections enable row level security;
alter table public.proposal_template_items enable row level security;
alter table public.proposal_template_versions enable row level security;
alter table public.proposal_versions enable row level security;
create policy "proposal readers read templates" on public.proposal_templates for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
create policy "proposal readers read template sections" on public.proposal_template_sections for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
create policy "proposal readers read template items" on public.proposal_template_items for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
create policy "proposal readers read template versions" on public.proposal_template_versions for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
create policy "proposal readers read versions" on public.proposal_versions for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
revoke all on table public.proposal_templates,public.proposal_template_sections,public.proposal_template_items,public.proposal_template_versions,public.proposal_versions from public,anon,authenticated,service_role;
grant select on table public.proposal_templates,public.proposal_template_sections,public.proposal_template_items,public.proposal_template_versions,public.proposal_versions to authenticated;
revoke all on function private.proposal_template_snapshot(uuid),public.create_proposal_template(text,text),public.update_proposal_template(uuid,text,text,boolean),public.save_proposal_template_section(uuid,uuid,public.proposal_section_type,text,text,boolean),public.save_proposal_template_item(uuid,uuid,uuid,text,text,numeric,public.service_unit,numeric),public.create_proposal_template_version(uuid,uuid),public.create_proposal_from_template(uuid,uuid,text,date,uuid),public.create_proposal_version(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.create_proposal_template(text,text),public.update_proposal_template(uuid,text,text,boolean),public.save_proposal_template_section(uuid,uuid,public.proposal_section_type,text,text,boolean),public.save_proposal_template_item(uuid,uuid,uuid,text,text,numeric,public.service_unit,numeric),public.create_proposal_template_version(uuid,uuid),public.create_proposal_from_template(uuid,uuid,text,date,uuid),public.create_proposal_version(uuid,uuid) to authenticated;

alter table public.audit_logs drop constraint audit_logs_action_catalog;
alter table public.audit_logs add constraint audit_logs_action_catalog check(action=any(array[
'auth.login.succeeded','auth.login.failed','auth.logout.succeeded','auth.password_reset.requested','auth.password_reset.completed','auth.invitation.created','auth.invitation.accepted','auth.invitation.failed','auth.mfa.enrollment_started','auth.mfa.enrollment_completed','auth.mfa.challenge.succeeded','auth.mfa.challenge.failed','auth.mfa.factor_added','auth.mfa.factor_removed','auth.access.denied','member.invited','member.activated','member.suspended','member.reactivated','member.role.assigned','member.role.removed','permission.assignment.denied','administrator.bootstrap.completed',
'crm.lead.created','crm.lead.updated','crm.lead.assigned','crm.lead.triage_changed','crm.lead.archived','crm.lead.reactivated','crm.company.created','crm.company.updated','crm.company.archived','crm.company.reactivated','crm.contact.created','crm.contact.updated','crm.contact.archived','crm.contact.reactivated','crm.opportunity.created','crm.opportunity.updated','crm.opportunity.assigned','crm.opportunity.stage_changed','crm.opportunity.won','crm.opportunity.lost','crm.opportunity.reopened','crm.opportunity.archived','crm.activity.created','crm.task.created','crm.task.updated','crm.task.assigned','crm.task.completed','crm.task.cancelled','crm.task.reopened','crm.client.created','crm.opportunity.converted',
'proposal.service.created','proposal.service.updated','proposal.service.deactivated','proposal.record.created','proposal.record.updated','proposal.item.created','proposal.item.updated','proposal.item.removed','proposal.item.reordered','proposal.template.created','proposal.template.updated','proposal.template.deactivated','proposal.template.version.created','proposal.created.from_template','proposal.version.created'
]));

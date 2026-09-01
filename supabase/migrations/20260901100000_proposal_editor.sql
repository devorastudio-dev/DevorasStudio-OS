create type public.proposal_section_type as enum ('introduction','objective','scope','deliverables','technologies','timeline','commercial_terms','notes','closing','custom');

create table public.proposal_sections(
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, proposal_id uuid not null,
 section_type public.proposal_section_type not null, title text not null, content text not null default '', position integer not null,
 is_visible boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null,
 constraint proposal_sections_proposal_fk foreign key(proposal_id,organization_id) references public.proposals(id,organization_id) on delete cascade,
 constraint proposal_sections_title_check check(char_length(btrim(title)) between 1 and 120),
 constraint proposal_sections_content_check check(char_length(content)<=12000),
 constraint proposal_sections_position_check check(position between 1 and 100),
 constraint proposal_sections_position_key unique(proposal_id,position) deferrable initially immediate
);
create index proposal_sections_org_proposal_idx on public.proposal_sections(organization_id,proposal_id,position);

create table public.organization_document_settings(
 organization_id uuid primary key references public.organizations(id) on delete cascade,
 display_name text not null, email text, phone text, website text, city text, logo_path text,
 updated_at timestamptz not null default now(), updated_by uuid references public.profiles(id) on delete set null,
 constraint document_display_name_check check(char_length(btrim(display_name)) between 1 and 120),
 constraint document_email_check check(email is null or (char_length(email)<=254 and email=lower(email) and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
 constraint document_phone_check check(phone is null or char_length(btrim(phone)) between 7 and 30),
 constraint document_website_check check(website is null or char_length(website)<=2048),
 constraint document_city_check check(city is null or char_length(btrim(city))<=120),
 constraint document_logo_check check(logo_path is null or (char_length(logo_path)<=300 and logo_path like '/%'))
);

create function private.create_default_proposal_sections() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.proposal_sections(organization_id,proposal_id,section_type,title,content,position,is_visible,created_by) values
 (new.organization_id,new.id,'introduction','Apresentação','',1,true,new.created_by),(new.organization_id,new.id,'objective','Objetivo','',2,true,new.created_by),
 (new.organization_id,new.id,'scope','Escopo','',3,true,new.created_by),(new.organization_id,new.id,'deliverables','Entregáveis','',4,true,new.created_by),
 (new.organization_id,new.id,'technologies','Tecnologias','',5,true,new.created_by),(new.organization_id,new.id,'timeline','Prazo estimado','',6,true,new.created_by),
 (new.organization_id,new.id,'commercial_terms','Condições comerciais','',7,true,new.created_by),(new.organization_id,new.id,'notes','Observações','',8,true,new.created_by),
 (new.organization_id,new.id,'closing','Encerramento','',9,true,new.created_by);
 return new;
end $$;
create trigger proposals_default_sections after insert on public.proposals for each row execute function private.create_default_proposal_sections();

create function public.save_proposal_section(target_proposal_id uuid,target_section_id uuid default null,target_section_type public.proposal_section_type default 'custom',section_title text default null,section_content text default '',target_visible boolean default true)
returns uuid language plpgsql security definer set search_path='' as $$
declare m public.organization_members; p public.proposals%rowtype; result uuid; next_position integer;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
 select * into p from public.proposals where id=target_proposal_id and organization_id=m.organization_id for update; if p.id is null or p.status<>'draft' then raise exception using errcode='23514',message='Proposal is not editable.'; end if;
 if target_section_id is null then select coalesce(max(position),0)+1 into next_position from public.proposal_sections where proposal_id=p.id; insert into public.proposal_sections(organization_id,proposal_id,section_type,title,content,position,is_visible,created_by,updated_by) values(m.organization_id,p.id,target_section_type,btrim(section_title),coalesce(section_content,''),next_position,target_visible,auth.uid(),auth.uid()) returning id into result;
 else update public.proposal_sections set title=btrim(section_title),content=coalesce(section_content,''),is_visible=target_visible,updated_at=now(),updated_by=auth.uid() where id=target_section_id and proposal_id=p.id and organization_id=m.organization_id returning id into result; if result is null then raise exception using errcode='P0002',message='Proposal section not available.'; end if; end if;
 insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.record.updated','proposal',p.id,'success',jsonb_build_object('area','section','operation',case when target_section_id is null then 'created' else 'updated' end,'section_id',result,'type',target_section_type,'visible',target_visible)); return result;
end $$;

create function public.remove_proposal_section(target_section_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare m public.organization_members; s public.proposal_sections%rowtype; p public.proposals%rowtype;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if; select * into s from public.proposal_sections where id=target_section_id and organization_id=m.organization_id; select * into p from public.proposals where id=s.proposal_id and organization_id=m.organization_id for update; if s.id is null or p.status<>'draft' then raise exception using errcode='23514',message='Proposal is not editable.'; end if; delete from public.proposal_sections where id=s.id; update public.proposal_sections set position=position-1 where proposal_id=p.id and position>s.position; insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.record.updated','proposal',p.id,'success',jsonb_build_object('area','section','operation','removed','section_id',s.id,'type',s.section_type)); end $$;

create function public.move_proposal_section(target_section_id uuid,direction integer) returns void language plpgsql security definer set search_path='' as $$
declare m public.organization_members; s public.proposal_sections%rowtype; adjacent public.proposal_sections%rowtype; p public.proposals%rowtype;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if; if direction not in(-1,1) then raise exception using errcode='22023',message='Invalid movement.'; end if; select * into s from public.proposal_sections where id=target_section_id and organization_id=m.organization_id for update; select * into p from public.proposals where id=s.proposal_id and organization_id=m.organization_id for update; if s.id is null or p.status<>'draft' then raise exception using errcode='23514',message='Proposal is not editable.'; end if; select * into adjacent from public.proposal_sections where proposal_id=s.proposal_id and position=s.position+direction for update; if adjacent.id is null then return; end if; set constraints public.proposal_sections_position_key deferred; update public.proposal_sections set position=adjacent.position,updated_at=now(),updated_by=auth.uid() where id=s.id; update public.proposal_sections set position=s.position,updated_at=now(),updated_by=auth.uid() where id=adjacent.id; insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.record.updated','proposal',p.id,'success',jsonb_build_object('area','section','operation','reordered','section_id',s.id,'direction',direction)); end $$;

create function public.update_proposal_document_settings(settings_display_name text,settings_email text default null,settings_phone text default null,settings_website text default null,settings_city text default null,settings_logo_path text default null) returns void language plpgsql security definer set search_path='' as $$
declare m public.organization_members; begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if; insert into public.organization_document_settings(organization_id,display_name,email,phone,website,city,logo_path,updated_by) values(m.organization_id,btrim(settings_display_name),nullif(lower(btrim(settings_email)),''),nullif(btrim(settings_phone),''),nullif(btrim(settings_website),''),nullif(btrim(settings_city),''),nullif(btrim(settings_logo_path),''),auth.uid()) on conflict(organization_id) do update set display_name=excluded.display_name,email=excluded.email,phone=excluded.phone,website=excluded.website,city=excluded.city,logo_path=excluded.logo_path,updated_at=now(),updated_by=auth.uid(); insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata) values(m.organization_id,auth.uid(),'proposal.record.updated','organization',m.organization_id,'success',jsonb_build_object('area','document_settings','operation','updated')); end $$;

alter table public.proposal_sections enable row level security; alter table public.organization_document_settings enable row level security;
create policy "proposal readers read sections" on public.proposal_sections for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
create policy "proposal readers read document settings" on public.organization_document_settings for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
revoke all on table public.proposal_sections,public.organization_document_settings from public,anon,authenticated,service_role; grant select on table public.proposal_sections,public.organization_document_settings to authenticated;
revoke all on function public.save_proposal_section(uuid,uuid,public.proposal_section_type,text,text,boolean),public.remove_proposal_section(uuid),public.move_proposal_section(uuid,integer),public.update_proposal_document_settings(text,text,text,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.save_proposal_section(uuid,uuid,public.proposal_section_type,text,text,boolean),public.remove_proposal_section(uuid),public.move_proposal_section(uuid,integer),public.update_proposal_document_settings(text,text,text,text,text,text) to authenticated;

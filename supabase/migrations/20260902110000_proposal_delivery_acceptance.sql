-- D5: delivery links, commercial history and public decisions for immutable versions.
alter type public.proposal_status add value if not exists 'sent';
alter type public.proposal_status add value if not exists 'accepted';
alter type public.proposal_status add value if not exists 'rejected';
alter type public.proposal_status add value if not exists 'expired';

create table public.proposal_delivery_links (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
  proposal_id uuid not null, proposal_version_id uuid not null, token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
  state text not null default 'pending' check(state in ('pending','active','revoked')), expires_at timestamptz not null,
  recipient_email text, message text check(char_length(message)<=1000), created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), activated_at timestamptz, revoked_at timestamptz,
  constraint proposal_delivery_proposal_fk foreign key(proposal_id,organization_id) references public.proposals(id,organization_id) on delete restrict,
  constraint proposal_delivery_version_fk foreign key(proposal_version_id,organization_id) references public.proposal_versions(id,organization_id) on delete restrict
);
create index proposal_delivery_proposal_idx on public.proposal_delivery_links(organization_id,proposal_id,created_at desc);
create table private.proposal_public_rate_limits(token_hash text not null,action text not null,window_start timestamptz not null,count integer not null,primary key(token_hash,action,window_start));
create function private.consume_proposal_rate_limit(target_hash text,target_action text,target_limit integer) returns boolean language plpgsql security definer set search_path='' as $$ declare current_count integer; bucket timestamptz:=date_trunc('minute',now()); begin insert into private.proposal_public_rate_limits values(target_hash,target_action,bucket,1) on conflict(token_hash,action,window_start) do update set count=private.proposal_public_rate_limits.count+1 returning count into current_count; return current_count<=target_limit; end $$;

create table public.proposal_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
  proposal_id uuid not null, proposal_version_id uuid, delivery_link_id uuid,
  event_type text not null check(event_type in ('version_created','sent','resent','viewed','accepted','rejected','expired','link_created','link_revoked','email_failed')),
  actor_type text not null check(actor_type in ('internal','client','system')), actor_user_id uuid references public.profiles(id) on delete restrict,
  metadata jsonb not null default '{}' check(jsonb_typeof(metadata)='object'), created_at timestamptz not null default now(),
  constraint proposal_events_proposal_fk foreign key(proposal_id,organization_id) references public.proposals(id,organization_id) on delete restrict,
  constraint proposal_events_version_fk foreign key(proposal_version_id,organization_id) references public.proposal_versions(id,organization_id) on delete restrict,
  constraint proposal_events_link_fk foreign key(delivery_link_id) references public.proposal_delivery_links(id) on delete restrict
);
create index proposal_events_timeline_idx on public.proposal_events(organization_id,proposal_id,created_at desc);

create table public.proposal_decisions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
  proposal_id uuid not null, proposal_version_id uuid not null, delivery_link_id uuid not null unique references public.proposal_delivery_links(id) on delete restrict,
  decision text not null check(decision in ('accepted','rejected')), responsible_name text not null check(char_length(btrim(responsible_name)) between 2 and 160),
  responsible_email text, reason text check(char_length(reason)<=1000), created_at timestamptz not null default now(),
  constraint proposal_decisions_proposal_fk foreign key(proposal_id,organization_id) references public.proposals(id,organization_id) on delete restrict,
  constraint proposal_decisions_version_fk foreign key(proposal_version_id,organization_id) references public.proposal_versions(id,organization_id) on delete restrict
);

alter table public.proposals add column sent_version_id uuid, add column accepted_version_id uuid, add column sent_at timestamptz, add column first_viewed_at timestamptz, add column accepted_at timestamptz, add column rejected_at timestamptz;
alter table public.proposals add constraint proposals_sent_version_fk foreign key(sent_version_id,organization_id) references public.proposal_versions(id,organization_id) on delete restrict;
alter table public.proposals add constraint proposals_accepted_version_fk foreign key(accepted_version_id,organization_id) references public.proposal_versions(id,organization_id) on delete restrict;

create function public.prepare_proposal_delivery(target_version_id uuid,target_token_hash text,target_expires_at timestamptz,target_recipient_email text default null,target_message text default null)
returns uuid language plpgsql security definer set search_path='' as $$ declare m public.organization_members; v public.proposal_versions; result uuid;
begin select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
if target_token_hash !~ '^[a-f0-9]{64}$' or target_expires_at<=now() then raise exception using errcode='22023',message='Invalid delivery.'; end if;
select * into v from public.proposal_versions where id=target_version_id and organization_id=m.organization_id; if v.id is null then raise exception using errcode='P0002',message='Version not available.'; end if;
insert into public.proposal_delivery_links(organization_id,proposal_id,proposal_version_id,token_hash,expires_at,recipient_email,message,created_by) values(m.organization_id,v.proposal_id,v.id,target_token_hash,target_expires_at,nullif(lower(btrim(target_recipient_email)),''),nullif(btrim(target_message),''),auth.uid()) returning id into result;
insert into public.proposal_events(organization_id,proposal_id,proposal_version_id,delivery_link_id,event_type,actor_type,actor_user_id) values(m.organization_id,v.proposal_id,v.id,result,'link_created','internal',auth.uid()); return result; end $$;

create function public.activate_proposal_delivery(target_delivery_id uuid,target_resent boolean default false) returns void language plpgsql security definer set search_path='' as $$ declare m public.organization_members; d public.proposal_delivery_links; begin
select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
select * into d from public.proposal_delivery_links where id=target_delivery_id and organization_id=m.organization_id for update; if d.id is null or d.state='revoked' then raise exception using errcode='P0002',message='Delivery not available.'; end if;
update public.proposal_delivery_links set state='active',activated_at=coalesce(activated_at,now()) where id=d.id;
update public.proposals set status='sent',sent_version_id=d.proposal_version_id,sent_at=now(),updated_at=now() where id=d.proposal_id and status not in('accepted','rejected');
insert into public.proposal_events(organization_id,proposal_id,proposal_version_id,delivery_link_id,event_type,actor_type,actor_user_id) values(m.organization_id,d.proposal_id,d.proposal_version_id,d.id,case when target_resent then 'resent' else 'sent' end,'internal',auth.uid()); end $$;

create function public.revoke_proposal_delivery(target_delivery_id uuid) returns void language plpgsql security definer set search_path='' as $$ declare m public.organization_members; d public.proposal_delivery_links; begin
select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
update public.proposal_delivery_links set state='revoked',revoked_at=now() where id=target_delivery_id and organization_id=m.organization_id and state<>'revoked' returning * into d; if d.id is null then raise exception using errcode='P0002',message='Delivery not available.'; end if;
insert into public.proposal_events(organization_id,proposal_id,proposal_version_id,delivery_link_id,event_type,actor_type,actor_user_id) values(m.organization_id,d.proposal_id,d.proposal_version_id,d.id,'link_revoked','internal',auth.uid()); end $$;

create function public.fail_proposal_delivery(target_delivery_id uuid) returns void language plpgsql security definer set search_path='' as $$ declare m public.organization_members; d public.proposal_delivery_links; begin
select * into m from private.current_crm_membership(); if m.id is null or not private.has_permission('proposals.write',m.organization_id) then raise exception using errcode='P0001',message='Proposal operation not permitted.'; end if;
update public.proposal_delivery_links set state='revoked',revoked_at=now() where id=target_delivery_id and organization_id=m.organization_id and state='pending' returning * into d;
if d.id is not null then insert into public.proposal_events(organization_id,proposal_id,proposal_version_id,delivery_link_id,event_type,actor_type,actor_user_id) values(m.organization_id,d.proposal_id,d.proposal_version_id,d.id,'email_failed','internal',auth.uid()); end if; end $$;

create function public.get_public_proposal(target_token_hash text,target_record_view boolean default false) returns jsonb language plpgsql security definer set search_path='' as $$ declare d public.proposal_delivery_links; v public.proposal_versions; expired boolean; begin
select * into d from public.proposal_delivery_links where token_hash=target_token_hash and state='active' for update; if d.id is null then return null; end if; if not private.consume_proposal_rate_limit(target_token_hash,'view',120) then return null; end if; expired:=d.expires_at<=now(); select * into v from public.proposal_versions where id=d.proposal_version_id;
if target_record_view and not expired then update public.proposals set first_viewed_at=coalesce(first_viewed_at,now()) where id=d.proposal_id; if not exists(select 1 from public.proposal_events where delivery_link_id=d.id and event_type='viewed') then insert into public.proposal_events(organization_id,proposal_id,proposal_version_id,delivery_link_id,event_type,actor_type) values(d.organization_id,d.proposal_id,d.proposal_version_id,d.id,'viewed','client'); end if; end if;
return jsonb_build_object('snapshot',v.snapshot,'version',v.version_number,'expiresAt',d.expires_at,'expired',expired,'status',(select status from public.proposals where id=d.proposal_id),'attachments',coalesce((select jsonb_agg(jsonb_build_object('id',a.attachment_id,'fileName',a.file_name)) from public.proposal_version_attachments a where a.proposal_version_id=v.id),'[]'::jsonb)); end $$;

create function public.decide_public_proposal(target_token_hash text,target_decision text,target_name text,target_email text default null,target_reason text default null) returns text language plpgsql security definer set search_path='' as $$ declare d public.proposal_delivery_links; p public.proposals; existing text; begin
select * into d from public.proposal_delivery_links where token_hash=target_token_hash and state='active' for update; if d.id is null then raise exception using errcode='P0002',message='Proposal not available.'; end if; if not private.consume_proposal_rate_limit(target_token_hash,'decision',20) then raise exception using errcode='P0004',message='Too many attempts.'; end if; if d.expires_at<=now() then raise exception using errcode='P0003',message='Proposal expired.'; end if; if target_decision not in('accepted','rejected') or char_length(btrim(target_name))<2 then raise exception using errcode='22023',message='Invalid decision.'; end if;
select decision into existing from public.proposal_decisions where delivery_link_id=d.id; if existing is not null then if existing=target_decision then return existing; else raise exception using errcode='P0001',message='Decision is final.'; end if; end if;
select * into p from public.proposals where id=d.proposal_id for update; if p.status in('accepted','rejected') then raise exception using errcode='P0001',message='Decision is final.'; end if;
insert into public.proposal_decisions(organization_id,proposal_id,proposal_version_id,delivery_link_id,decision,responsible_name,responsible_email,reason) values(d.organization_id,d.proposal_id,d.proposal_version_id,d.id,target_decision,btrim(target_name),nullif(lower(btrim(target_email)),''),nullif(btrim(target_reason),''));
update public.proposals set status=target_decision::public.proposal_status,accepted_version_id=case when target_decision='accepted' then d.proposal_version_id end,accepted_at=case when target_decision='accepted' then now() end,rejected_at=case when target_decision='rejected' then now() end,updated_at=now() where id=d.proposal_id;
insert into public.proposal_events(organization_id,proposal_id,proposal_version_id,delivery_link_id,event_type,actor_type) values(d.organization_id,d.proposal_id,d.proposal_version_id,d.id,target_decision,'client'); return target_decision; end $$;

alter table public.proposal_delivery_links enable row level security; alter table public.proposal_events enable row level security; alter table public.proposal_decisions enable row level security;
create policy "proposal readers read delivery links" on public.proposal_delivery_links for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
create policy "proposal readers read events" on public.proposal_events for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
create policy "proposal readers read decisions" on public.proposal_decisions for select to authenticated using((select private.has_permission('proposals.read',organization_id)));
revoke all on public.proposal_delivery_links,public.proposal_events,public.proposal_decisions from public,anon,authenticated,service_role;
grant select on public.proposal_delivery_links,public.proposal_events,public.proposal_decisions to authenticated;
revoke all on function private.consume_proposal_rate_limit(text,text,integer),public.prepare_proposal_delivery(uuid,text,timestamptz,text,text),public.activate_proposal_delivery(uuid,boolean),public.revoke_proposal_delivery(uuid),public.fail_proposal_delivery(uuid),public.get_public_proposal(text,boolean),public.decide_public_proposal(text,text,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.prepare_proposal_delivery(uuid,text,timestamptz,text,text),public.activate_proposal_delivery(uuid,boolean),public.revoke_proposal_delivery(uuid),public.fail_proposal_delivery(uuid) to authenticated;
grant execute on function public.get_public_proposal(text,boolean),public.decide_public_proposal(text,text,text,text,text) to anon,authenticated;

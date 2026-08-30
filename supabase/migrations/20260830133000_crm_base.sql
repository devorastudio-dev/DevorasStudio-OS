create type public.crm_record_state as enum ('active', 'archived');
create type public.crm_lead_triage_status as enum ('new', 'in_review', 'qualified', 'disqualified');
create type public.crm_source as enum (
  'website', '99freelas', 'instagram', 'pinterest', 'tiktok',
  'whatsapp', 'google_maps', 'referral', 'outbound', 'other'
);

create table public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  display_name text not null,
  normalized_name text not null,
  website text,
  phone text,
  email text,
  source public.crm_source,
  source_detail text,
  notes text,
  state public.crm_record_state not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_companies_id_organization_key unique (id, organization_id),
  constraint crm_companies_name_check check (char_length(btrim(display_name)) between 1 and 160),
  constraint crm_companies_normalized_name_check check (char_length(normalized_name) between 1 and 160),
  constraint crm_companies_website_check check (website is null or (char_length(website) <= 2048 and website ~ '^https?://')),
  constraint crm_companies_phone_check check (phone is null or (char_length(phone) between 7 and 30 and phone ~ '^[0-9+(). -]+$')),
  constraint crm_companies_email_check check (email is null or (char_length(email) <= 254 and email = lower(email) and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  constraint crm_companies_source_detail_check check ((source = 'other' and source_detail is not null and char_length(btrim(source_detail)) between 1 and 120) or (source <> 'other' and source_detail is null) or (source is null and source_detail is null)),
  constraint crm_companies_notes_check check (notes is null or char_length(notes) <= 1000)
);

create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  company_id uuid,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  is_primary boolean not null default false,
  state public.crm_record_state not null default 'active',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_contacts_id_organization_key unique (id, organization_id),
  constraint crm_contacts_company_fk foreign key (company_id, organization_id) references public.crm_companies(id, organization_id) on delete restrict,
  constraint crm_contacts_name_check check (char_length(btrim(full_name)) between 2 and 160),
  constraint crm_contacts_email_check check (email is null or (char_length(email) <= 254 and email = lower(email) and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
  constraint crm_contacts_phone_check check (phone is null or (char_length(phone) between 7 and 30 and phone ~ '^[0-9+(). -]+$')),
  constraint crm_contacts_job_title_check check (job_title is null or char_length(job_title) <= 120),
  constraint crm_contacts_primary_company_check check (not is_primary or company_id is not null)
);

create unique index crm_contacts_one_primary_per_company_idx
  on public.crm_contacts (organization_id, company_id)
  where is_primary and state = 'active';
create index crm_companies_org_state_name_idx on public.crm_companies (organization_id, state, normalized_name);
create index crm_contacts_org_state_name_idx on public.crm_contacts (organization_id, state, lower(full_name));
create index crm_contacts_org_company_idx on public.crm_contacts (organization_id, company_id) where company_id is not null;

alter table public.leads drop constraint leads_source_check;
alter table public.leads drop constraint leads_status_check;
alter table public.leads
  alter column consented_at drop not null,
  alter column submission_fingerprint drop not null,
  add column triage_status public.crm_lead_triage_status not null default 'new',
  add column source_detail text,
  add column assigned_membership_id uuid,
  add column company_id uuid,
  add column contact_id uuid,
  add column disqualification_reason text,
  add column internal_updated_at timestamptz not null default now(),
  add column internal_updated_by uuid references public.profiles(id) on delete set null,
  add column archived_at timestamptz,
  add column version integer not null default 1,
  add constraint leads_source_check check (source = any (array['website','99freelas','instagram','pinterest','tiktok','whatsapp','google_maps','referral','outbound','other'])),
  add constraint leads_source_detail_check check ((source = 'other' and source_detail is not null and char_length(btrim(source_detail)) between 1 and 120) or (source <> 'other' and source_detail is null)),
  add constraint leads_status_legacy_check check (status = 'new'),
  add constraint leads_disqualification_check check ((triage_status = 'disqualified' and disqualification_reason is not null and char_length(btrim(disqualification_reason)) between 3 and 500) or (triage_status <> 'disqualified' and disqualification_reason is null)),
  add constraint leads_version_check check (version > 0),
  add constraint leads_assignee_fk foreign key (assigned_membership_id, organization_id) references public.organization_members(id, organization_id) on delete restrict,
  add constraint leads_company_fk foreign key (company_id, organization_id) references public.crm_companies(id, organization_id) on delete restrict,
  add constraint leads_contact_fk foreign key (contact_id, organization_id) references public.crm_contacts(id, organization_id) on delete restrict;

create index leads_org_triage_created_idx on public.leads (organization_id, triage_status, created_at desc);
create index leads_org_assignee_created_idx on public.leads (organization_id, assigned_membership_id, created_at desc);
create index leads_org_company_idx on public.leads (organization_id, company_id) where company_id is not null;
create index leads_org_contact_idx on public.leads (organization_id, contact_id) where contact_id is not null;

create function private.current_crm_membership()
returns public.organization_members
language sql stable security definer set search_path = '' as $$
  select membership from public.organization_members membership
  where membership.user_id = (select auth.uid()) and membership.status = 'active'
  limit 1;
$$;

create function private.prepare_crm_record()
returns trigger language plpgsql security definer set search_path = '' as $$
declare membership public.organization_members;
begin
  if auth.uid() is null then
    new.display_name := btrim(new.display_name);
    new.normalized_name := lower(regexp_replace(new.display_name, '\s+', ' ', 'g'));
    new.email := nullif(lower(btrim(new.email)), '');
    new.phone := nullif(btrim(new.phone), '');
    new.website := nullif(btrim(new.website), '');
    new.source_detail := nullif(btrim(new.source_detail), '');
    new.notes := nullif(btrim(new.notes), '');
    new.updated_at := now();
    return new;
  end if;
  select * into membership from private.current_crm_membership();
  if membership.id is null or not private.has_permission('crm.write', membership.organization_id) then
    raise exception using errcode = 'P0001', message = 'CRM operation not permitted.';
  end if;
  if tg_op = 'INSERT' then
    new.id := gen_random_uuid();
    new.organization_id := membership.organization_id;
    new.created_by := auth.uid();
    new.created_at := now();
  elsif new.organization_id <> old.organization_id or new.created_by is distinct from old.created_by then
    raise exception using errcode = 'P0001', message = 'CRM operation not permitted.';
  elsif new.id <> old.id or new.created_at <> old.created_at then
    raise exception using errcode = 'P0001', message = 'CRM immutable fields cannot be changed.';
  end if;
  new.display_name := btrim(new.display_name);
  new.normalized_name := lower(regexp_replace(new.display_name, '\s+', ' ', 'g'));
  new.email := nullif(lower(btrim(new.email)), '');
  new.phone := nullif(btrim(new.phone), '');
  new.website := nullif(btrim(new.website), '');
  new.source_detail := nullif(btrim(new.source_detail), '');
  new.notes := nullif(btrim(new.notes), '');
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

create function private.prepare_crm_contact()
returns trigger language plpgsql security definer set search_path = '' as $$
declare membership public.organization_members;
begin
  if auth.uid() is null then
    new.full_name := btrim(new.full_name);
    new.email := nullif(lower(btrim(new.email)), '');
    new.phone := nullif(btrim(new.phone), '');
    new.job_title := nullif(btrim(new.job_title), '');
    new.updated_at := now();
    return new;
  end if;
  select * into membership from private.current_crm_membership();
  if membership.id is null or not private.has_permission('crm.write', membership.organization_id) then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
  if tg_op = 'INSERT' then new.id:=gen_random_uuid(); new.organization_id:=membership.organization_id; new.created_by:=auth.uid(); new.created_at:=now();
  elsif new.organization_id<>old.organization_id or new.created_by is distinct from old.created_by then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
  if tg_op = 'UPDATE' and (new.id<>old.id or new.created_at<>old.created_at) then raise exception using errcode='P0001',message='CRM immutable fields cannot be changed.'; end if;
  new.full_name:=btrim(new.full_name); new.email:=nullif(lower(btrim(new.email)),''); new.phone:=nullif(btrim(new.phone),''); new.job_title:=nullif(btrim(new.job_title),'');
  new.updated_by:=auth.uid(); new.updated_at:=now(); return new;
end;
$$;

create function private.prepare_crm_lead()
returns trigger language plpgsql security definer set search_path = '' as $$
declare membership public.organization_members; assignee_status public.organization_member_status; contact_company uuid;
begin
  select * into membership from private.current_crm_membership();
  if membership.id is null or not private.has_permission('crm.write', membership.organization_id) then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
  if tg_op = 'INSERT' then new.id:=gen_random_uuid(); new.organization_id:=membership.organization_id; new.created_at:=now(); new.consented_at:=null; new.submission_fingerprint:=null;
  elsif new.organization_id<>old.organization_id then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
  if tg_op='UPDATE' and (new.id<>old.id or new.created_at<>old.created_at or new.consented_at is distinct from old.consented_at or new.submission_fingerprint is distinct from old.submission_fingerprint) then raise exception using errcode='P0001',message='CRM immutable fields cannot be changed.'; end if;
  if new.assigned_membership_id is not null then
    select status into assignee_status from public.organization_members where id=new.assigned_membership_id and organization_id=membership.organization_id;
    if assignee_status is distinct from 'active' then raise exception using errcode='23514',message='Lead assignee must be an active member.'; end if;
  end if;
  if new.contact_id is not null then
    select company_id into contact_company from public.crm_contacts where id=new.contact_id and organization_id=membership.organization_id;
    if new.company_id is not null and contact_company is distinct from new.company_id then raise exception using errcode='23514',message='Lead contact is not linked to the selected company.'; end if;
  end if;
  new.full_name:=btrim(new.full_name); new.email:=lower(btrim(new.email)); new.phone:=nullif(btrim(new.phone),''); new.company:=nullif(btrim(new.company),''); new.message:=btrim(new.message); new.source_detail:=nullif(btrim(new.source_detail),'');
  new.internal_updated_by:=auth.uid(); new.internal_updated_at:=now();
  if tg_op='UPDATE' then new.version:=old.version+1; end if;
  if new.archived_at is not null and (tg_op='INSERT' or old.archived_at is null) then new.archived_at:=now(); end if;
  return new;
end;
$$;

create trigger crm_companies_prepare before insert or update on public.crm_companies for each row execute function private.prepare_crm_record();
create trigger crm_contacts_prepare before insert or update on public.crm_contacts for each row execute function private.prepare_crm_contact();
create trigger leads_prepare_internal before insert or update on public.leads for each row when (auth.uid() is not null) execute function private.prepare_crm_lead();

alter table public.crm_companies enable row level security;
alter table public.crm_contacts enable row level security;
create policy "authorized members read crm companies" on public.crm_companies for select to authenticated using ((select private.has_permission('crm.read', organization_id)));
create policy "authorized members write crm companies" on public.crm_companies for insert to authenticated with check ((select private.has_permission('crm.write', organization_id)));
create policy "authorized members update crm companies" on public.crm_companies for update to authenticated using ((select private.has_permission('crm.write', organization_id))) with check ((select private.has_permission('crm.write', organization_id)));
create policy "authorized members read crm contacts" on public.crm_contacts for select to authenticated using ((select private.has_permission('crm.read', organization_id)));
create policy "authorized members write crm contacts" on public.crm_contacts for insert to authenticated with check ((select private.has_permission('crm.write', organization_id)));
create policy "authorized members update crm contacts" on public.crm_contacts for update to authenticated using ((select private.has_permission('crm.write', organization_id))) with check ((select private.has_permission('crm.write', organization_id)));
create policy "authorized members create leads" on public.leads for insert to authenticated with check ((select private.has_permission('crm.write', organization_id)));
create policy "authorized members update leads" on public.leads for update to authenticated using ((select private.has_permission('crm.write', organization_id))) with check ((select private.has_permission('crm.write', organization_id)));

revoke all on table public.crm_companies, public.crm_contacts from public, anon, authenticated, service_role;
grant select, insert, update on table public.crm_companies, public.crm_contacts to authenticated;
grant insert, update on table public.leads to authenticated;

alter table public.audit_logs drop constraint audit_logs_action_catalog;
alter table public.audit_logs add constraint audit_logs_action_catalog check (action = any (array[
  'auth.login.succeeded','auth.login.failed','auth.logout.succeeded','auth.password_reset.requested','auth.password_reset.completed','auth.invitation.created','auth.invitation.accepted','auth.invitation.failed','auth.mfa.enrollment_started','auth.mfa.enrollment_completed','auth.mfa.challenge.succeeded','auth.mfa.challenge.failed','auth.mfa.factor_added','auth.mfa.factor_removed','auth.access.denied','member.invited','member.activated','member.suspended','member.reactivated','member.role.assigned','member.role.removed','permission.assignment.denied','administrator.bootstrap.completed',
  'crm.lead.created','crm.lead.updated','crm.lead.assigned','crm.lead.triage_changed','crm.lead.archived','crm.lead.reactivated','crm.company.created','crm.company.updated','crm.company.archived','crm.company.reactivated','crm.contact.created','crm.contact.updated','crm.contact.archived','crm.contact.reactivated'
]));

create function private.audit_crm_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare event_action text; entity_type text; metadata jsonb := '{}'::jsonb;
begin
  if auth.uid() is null then return new; end if;
  entity_type := case tg_table_name when 'leads' then 'lead' when 'crm_companies' then 'crm_company' else 'crm_contact' end;
  if tg_op='INSERT' then event_action := case entity_type when 'lead' then 'crm.lead.created' when 'crm_company' then 'crm.company.created' else 'crm.contact.created' end;
  else
    event_action := case entity_type when 'lead' then 'crm.lead.updated' when 'crm_company' then 'crm.company.updated' else 'crm.contact.updated' end;
    if entity_type='lead' then metadata:=jsonb_strip_nulls(jsonb_build_object('triage_from',old.triage_status,'triage_to',new.triage_status,'assigned',new.assigned_membership_id is not null)); end if;
  end if;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata)
  values(new.organization_id,auth.uid(),event_action,entity_type,new.id,'success',metadata);
  return new;
end;
$$;
create trigger crm_companies_audit after insert or update on public.crm_companies for each row execute function private.audit_crm_change();
create trigger crm_contacts_audit after insert or update on public.crm_contacts for each row execute function private.audit_crm_change();
create trigger leads_audit_internal after insert or update on public.leads for each row when (auth.uid() is not null) execute function private.audit_crm_change();

create function private.clear_inactive_crm_assignee()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status <> 'active' then
    update public.leads set assigned_membership_id = null, internal_updated_at = now()
    where organization_id = new.organization_id and assigned_membership_id = new.id;
  end if;
  return new;
end;
$$;
create trigger organization_members_clear_crm_assignee
after update of status on public.organization_members for each row
when (old.status is distinct from new.status and new.status <> 'active')
execute function private.clear_inactive_crm_assignee();

revoke all on function private.current_crm_membership(), private.prepare_crm_record(), private.prepare_crm_contact(), private.prepare_crm_lead(), private.audit_crm_change(), private.clear_inactive_crm_assignee() from public, anon, authenticated, service_role;
grant execute on function private.current_crm_membership() to authenticated;

comment on table public.crm_companies is 'Commercial companies scoped to a Devora OS tenant; distinct from authentication organizations.';
comment on table public.crm_contacts is 'Commercial contacts scoped to a Devora OS tenant.';

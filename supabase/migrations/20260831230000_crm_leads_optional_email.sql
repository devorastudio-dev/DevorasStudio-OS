alter table public.leads alter column email drop not null;

create or replace function private.prepare_crm_lead()
returns trigger language plpgsql security definer set search_path = '' as $$
declare membership public.organization_members; assignee_status public.organization_member_status; contact_company uuid;
begin
  select * into membership from private.current_crm_membership();
  if membership.id is null or not private.has_permission('crm.write', membership.organization_id) then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
  if tg_op = 'INSERT' then new.id:=gen_random_uuid(); new.organization_id:=membership.organization_id; new.created_at:=now(); new.consented_at:=null; new.submission_fingerprint:=null;
  elsif new.organization_id<>old.organization_id then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
  if tg_op='UPDATE' and (new.id<>old.id or new.created_at<>old.created_at or new.consented_at is distinct from old.consented_at or new.submission_fingerprint is distinct from old.submission_fingerprint) then raise exception using errcode='P0001',message='CRM immutable fields cannot be changed.'; end if;
  if new.assigned_membership_id is not null then select status into assignee_status from public.organization_members where id=new.assigned_membership_id and organization_id=membership.organization_id; if assignee_status is distinct from 'active' then raise exception using errcode='23514',message='Lead assignee must be an active member.'; end if; end if;
  if new.contact_id is not null then select company_id into contact_company from public.crm_contacts where id=new.contact_id and organization_id=membership.organization_id; if new.company_id is not null and contact_company is distinct from new.company_id then raise exception using errcode='23514',message='Lead contact is not linked to the selected company.'; end if; end if;
  new.full_name:=btrim(new.full_name); new.email:=nullif(lower(btrim(new.email)),''); new.phone:=nullif(btrim(new.phone),''); new.company:=nullif(btrim(new.company),''); new.message:=btrim(new.message); new.source_detail:=nullif(btrim(new.source_detail),'');
  new.internal_updated_by:=auth.uid(); new.internal_updated_at:=now();
  if tg_op='UPDATE' then new.version:=old.version+1; end if;
  if new.archived_at is not null and (tg_op='INSERT' or old.archived_at is null) then new.archived_at:=now(); end if;
  return new;
end;
$$;

create function public.update_crm_lead(target_lead_id uuid, expected_version integer, lead_full_name text, lead_email text, lead_phone text, lead_company text, lead_service_interest text, lead_message text, lead_source text, lead_source_detail text, target_assigned_membership_id uuid default null, target_company_id uuid default null, target_contact_id uuid default null, target_triage_status public.crm_lead_triage_status default 'new', lead_disqualification_reason text default null, target_archived boolean default false)
returns uuid language plpgsql security definer set search_path = '' as $$
declare membership public.organization_members; result uuid;
begin
  select * into membership from private.current_crm_membership();
  if membership.id is null or not private.has_permission('crm.write',membership.organization_id) then raise exception using errcode='P0001',message='CRM operation not permitted.'; end if;
  update public.leads set full_name=lead_full_name,email=nullif(lead_email,''),phone=nullif(lead_phone,''),company=nullif(lead_company,''),service_interest=lead_service_interest,message=lead_message,source=lead_source,source_detail=nullif(lead_source_detail,''),assigned_membership_id=target_assigned_membership_id,company_id=target_company_id,contact_id=target_contact_id,triage_status=target_triage_status,disqualification_reason=nullif(lead_disqualification_reason,''),archived_at=case when target_archived then coalesce(archived_at,now()) else null end
  where id=target_lead_id and organization_id=membership.organization_id and version=expected_version returning id into result;
  if result is null then raise exception using errcode='40001',message='Lead changed or unavailable.'; end if;
  return result;
end;
$$;

revoke all on function public.update_crm_lead(uuid,integer,text,text,text,text,text,text,text,text,uuid,uuid,uuid,public.crm_lead_triage_status,text,boolean) from public,anon,authenticated,service_role;
grant execute on function public.update_crm_lead(uuid,integer,text,text,text,text,text,text,text,text,uuid,uuid,uuid,public.crm_lead_triage_status,text,boolean) to authenticated;
comment on function public.update_crm_lead(uuid,integer,text,text,text,text,text,text,text,text,uuid,uuid,uuid,public.crm_lead_triage_status,text,boolean) is 'Updates the allowlisted commercial fields of one tenant-scoped lead with optimistic locking.';

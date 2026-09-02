-- D4: private proposal attachments and immutable version references.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proposal-attachments', 'proposal-attachments', false, 10485760, array['application/pdf','image/png','image/jpeg'])
on conflict (id) do update set public=false, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

create table public.proposal_attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  proposal_id uuid not null,
  file_name text not null check(char_length(file_name) between 1 and 180),
  storage_path text not null unique,
  mime_type text not null check(mime_type in ('application/pdf','image/png','image/jpeg')),
  size_bytes bigint not null check(size_bytes between 1 and 10485760),
  checksum_sha256 text not null check(checksum_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  created_by uuid not null references public.profiles(id) on delete restrict,
  constraint proposal_attachments_proposal_fk foreign key(proposal_id, organization_id)
    references public.proposals(id, organization_id) on delete restrict,
  constraint proposal_attachments_extension_matches_mime check (
    (mime_type='application/pdf' and lower(file_name) like '%.pdf') or
    (mime_type='image/png' and lower(file_name) like '%.png') or
    (mime_type='image/jpeg' and (lower(file_name) like '%.jpg' or lower(file_name) like '%.jpeg'))
  ),
  constraint proposal_attachments_id_org_key unique(id, organization_id)
);

alter table public.proposal_versions
  add constraint proposal_versions_id_org_key unique(id, organization_id);

create table public.proposal_version_attachments (
  proposal_version_id uuid not null,
  attachment_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null,
  checksum_sha256 text not null,
  created_at timestamptz not null default now(),
  primary key(proposal_version_id, attachment_id),
  constraint proposal_version_attachments_version_fk foreign key(proposal_version_id, organization_id)
    references public.proposal_versions(id, organization_id) on delete restrict,
  constraint proposal_version_attachments_attachment_fk foreign key(attachment_id, organization_id)
    references public.proposal_attachments(id, organization_id) on delete restrict
);

create index proposal_attachments_proposal_idx on public.proposal_attachments(organization_id, proposal_id, created_at desc);
create index proposal_version_attachments_version_idx on public.proposal_version_attachments(organization_id, proposal_version_id);

create function private.freeze_proposal_version_attachments() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.proposal_version_attachments(
    proposal_version_id, attachment_id, organization_id, file_name, storage_path, mime_type, size_bytes, checksum_sha256
  ) select new.id, a.id, a.organization_id, a.file_name, a.storage_path, a.mime_type, a.size_bytes, a.checksum_sha256
    from public.proposal_attachments a
    where a.proposal_id=new.proposal_id and a.organization_id=new.organization_id;
  return new;
end $$;

create trigger proposal_versions_freeze_attachments after insert on public.proposal_versions
for each row execute function private.freeze_proposal_version_attachments();

create function public.prepare_proposal_attachment(
  target_proposal_id uuid, attachment_file_name text, attachment_mime_type text,
  attachment_size_bytes bigint, attachment_checksum_sha256 text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare m public.organization_members; attachment_id uuid:=gen_random_uuid(); safe_name text; path text;
begin
  select * into m from private.current_crm_membership();
  if m.id is null or not private.has_permission('proposals.write',m.organization_id) then
    raise exception using errcode='P0001',message='Proposal operation not permitted.';
  end if;
  if attachment_mime_type not in ('application/pdf','image/png','image/jpeg')
    or attachment_size_bytes not between 1 and 10485760
    or attachment_checksum_sha256 !~ '^[a-f0-9]{64}$'
    or not (
      (attachment_mime_type='application/pdf' and lower(btrim(attachment_file_name)) like '%.pdf') or
      (attachment_mime_type='image/png' and lower(btrim(attachment_file_name)) like '%.png') or
      (attachment_mime_type='image/jpeg' and (lower(btrim(attachment_file_name)) like '%.jpg' or lower(btrim(attachment_file_name)) like '%.jpeg'))
    ) then
    raise exception using errcode='22023',message='Invalid attachment.';
  end if;
  perform 1 from public.proposals where id=target_proposal_id and organization_id=m.organization_id and status='draft';
  if not found then raise exception using errcode='P0002',message='Proposal not available.'; end if;
  safe_name:=left(regexp_replace(lower(btrim(attachment_file_name)),'[^a-z0-9._-]+','-','g'),180);
  safe_name:=regexp_replace(safe_name,'^[.-]+|[.-]+$','','g');
  if safe_name='' then safe_name='attachment'; end if;
  path:=m.organization_id||'/proposals/'||target_proposal_id||'/'||attachment_id||'/'||safe_name;
  insert into public.proposal_attachments(id,organization_id,proposal_id,file_name,storage_path,mime_type,size_bytes,checksum_sha256,created_by)
  values(attachment_id,m.organization_id,target_proposal_id,left(btrim(attachment_file_name),180),path,attachment_mime_type,attachment_size_bytes,attachment_checksum_sha256,auth.uid());
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata)
  values(m.organization_id,auth.uid(),'proposal.attachment_uploaded','proposal_attachment',attachment_id,'success',jsonb_build_object('proposal_id',target_proposal_id,'mime_type',attachment_mime_type,'size_bytes',attachment_size_bytes));
  return jsonb_build_object('id',attachment_id,'storage_path',path);
end $$;

create function public.remove_proposal_attachment(target_attachment_id uuid) returns text
language plpgsql security definer set search_path='' as $$
declare m public.organization_members; a public.proposal_attachments%rowtype;
begin
  select * into m from private.current_crm_membership();
  if m.id is null or not private.has_permission('proposals.write',m.organization_id) then
    raise exception using errcode='P0001',message='Proposal operation not permitted.';
  end if;
  select * into a from public.proposal_attachments where id=target_attachment_id and organization_id=m.organization_id for update;
  if a.id is null then raise exception using errcode='P0002',message='Attachment not available.'; end if;
  if exists(select 1 from public.proposal_version_attachments where attachment_id=a.id) then
    raise exception using errcode='P0001',message='Version attachment is immutable.';
  end if;
  delete from public.proposal_attachments where id=a.id;
  insert into public.audit_logs(organization_id,actor_user_id,action,entity_type,entity_id,outcome,metadata)
  values(m.organization_id,auth.uid(),'proposal.attachment_removed','proposal_attachment',a.id,'success',jsonb_build_object('proposal_id',a.proposal_id));
  return a.storage_path;
end $$;

alter table public.proposal_attachments enable row level security;
alter table public.proposal_version_attachments enable row level security;
create policy "proposal readers read attachments" on public.proposal_attachments for select to authenticated
using((select private.has_permission('proposals.read',organization_id)));
create policy "proposal readers read version attachments" on public.proposal_version_attachments for select to authenticated
using((select private.has_permission('proposals.read',organization_id)));
revoke all on public.proposal_attachments,public.proposal_version_attachments from public,anon,authenticated,service_role;
grant select on public.proposal_attachments,public.proposal_version_attachments to authenticated;
revoke all on function private.freeze_proposal_version_attachments(),public.prepare_proposal_attachment(uuid,text,text,bigint,text),public.remove_proposal_attachment(uuid) from public,anon,authenticated,service_role;
grant execute on function public.prepare_proposal_attachment(uuid,text,text,bigint,text),public.remove_proposal_attachment(uuid) to authenticated;

create policy "proposal members upload private objects" on storage.objects for insert to authenticated
with check(bucket_id='proposal-attachments' and exists(select 1 from public.proposal_attachments a where a.storage_path=name and a.created_by=auth.uid() and private.has_permission('proposals.write',a.organization_id)));
create policy "proposal members read private objects" on storage.objects for select to authenticated
using(bucket_id='proposal-attachments' and exists(select 1 from public.proposal_attachments a where a.storage_path=name and private.has_permission('proposals.read',a.organization_id)));
create policy "proposal members remove private objects" on storage.objects for delete to authenticated
using(bucket_id='proposal-attachments' and exists(select 1 from public.proposal_attachments a where a.storage_path=name and private.has_permission('proposals.write',a.organization_id) and not exists(select 1 from public.proposal_version_attachments va where va.attachment_id=a.id)));

alter table public.audit_logs drop constraint audit_logs_action_catalog;
alter table public.audit_logs add constraint audit_logs_action_catalog check(action=any(array[
'auth.login.succeeded','auth.login.failed','auth.logout.succeeded','auth.password_reset.requested','auth.password_reset.completed','auth.invitation.created','auth.invitation.accepted','auth.invitation.failed','auth.mfa.enrollment_started','auth.mfa.enrollment_completed','auth.mfa.challenge.succeeded','auth.mfa.challenge.failed','auth.mfa.factor_added','auth.mfa.factor_removed','auth.access.denied','member.invited','member.activated','member.suspended','member.reactivated','member.role.assigned','member.role.removed','permission.assignment.denied','administrator.bootstrap.completed',
'crm.lead.created','crm.lead.updated','crm.lead.assigned','crm.lead.triage_changed','crm.lead.archived','crm.lead.reactivated','crm.company.created','crm.company.updated','crm.company.archived','crm.company.reactivated','crm.contact.created','crm.contact.updated','crm.contact.archived','crm.contact.reactivated','crm.opportunity.created','crm.opportunity.updated','crm.opportunity.assigned','crm.opportunity.stage_changed','crm.opportunity.won','crm.opportunity.lost','crm.opportunity.reopened','crm.opportunity.archived','crm.activity.created','crm.task.created','crm.task.updated','crm.task.assigned','crm.task.completed','crm.task.cancelled','crm.task.reopened','crm.client.created','crm.opportunity.converted',
'proposal.service.created','proposal.service.updated','proposal.service.deactivated','proposal.record.created','proposal.record.updated','proposal.item.created','proposal.item.updated','proposal.item.removed','proposal.item.reordered','proposal.template.created','proposal.template.updated','proposal.template.deactivated','proposal.template.version.created','proposal.created.from_template','proposal.version.created','proposal.version_pdf_generated','proposal.attachment_uploaded','proposal.attachment_removed','proposal.attachment_downloaded'
]));

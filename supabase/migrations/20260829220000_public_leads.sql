create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  full_name text not null,
  email text not null,
  phone text,
  company text,
  service_interest text not null,
  message text not null,
  source text not null default 'website',
  landing_path text not null default '/',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  status text not null default 'new',
  consented_at timestamptz not null default now(),
  consent_version text not null default '2026-08',
  submission_fingerprint text not null,
  created_at timestamptz not null default now(),
  constraint leads_full_name_check check (char_length(full_name) between 2 and 120),
  constraint leads_email_check check (char_length(email) <= 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint leads_phone_check check (phone is null or (char_length(phone) between 7 and 30 and phone ~ '^[0-9+(). -]+$')),
  constraint leads_company_check check (company is null or char_length(company) <= 160),
  constraint leads_service_interest_check check (service_interest in ('digital_presence', 'business_systems', 'automation', 'other')),
  constraint leads_message_check check (char_length(message) between 20 and 2000),
  constraint leads_source_check check (source = 'website'),
  constraint leads_landing_path_check check (char_length(landing_path) between 1 and 200 and landing_path like '/%' and landing_path not like '%?%' and landing_path not like '%#%'),
  constraint leads_utm_source_check check (utm_source is null or char_length(utm_source) <= 120),
  constraint leads_utm_medium_check check (utm_medium is null or char_length(utm_medium) <= 120),
  constraint leads_utm_campaign_check check (utm_campaign is null or char_length(utm_campaign) <= 120),
  constraint leads_utm_content_check check (utm_content is null or char_length(utm_content) <= 120),
  constraint leads_utm_term_check check (utm_term is null or char_length(utm_term) <= 120),
  constraint leads_status_check check (status = 'new'),
  constraint leads_fingerprint_check check (char_length(submission_fingerprint) = 32)
);

create index leads_organization_created_at_idx on public.leads (organization_id, created_at desc);
create index leads_email_created_at_idx on public.leads (email, created_at desc);
create index leads_fingerprint_created_at_idx on public.leads (submission_fingerprint, created_at desc);

alter table public.leads enable row level security;

create policy "authorized members read leads"
on public.leads for select to authenticated
using ((select private.has_permission('crm.read', organization_id)));

revoke all on table public.leads from public, anon, authenticated, service_role;
grant select on table public.leads to authenticated;

create or replace function public.submit_public_lead(
  full_name text,
  email text,
  phone text,
  company text,
  service_interest text,
  message text,
  landing_path text default '/',
  utm_source text default null,
  utm_medium text default null,
  utm_campaign text default null,
  utm_content text default null,
  utm_term text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
  normalized_email text := lower(trim(email));
  fingerprint text;
begin
  select id into target_organization_id
  from public.organizations
  where slug = 'devora-studio';

  if target_organization_id is null then
    raise exception 'Lead destination is not configured.' using errcode = 'P0001';
  end if;

  fingerprint := md5(normalized_email || '|' || lower(trim(message)));
  perform pg_advisory_xact_lock(hashtextextended(normalized_email, 0));

  if exists (
    select 1 from public.leads
    where submission_fingerprint = fingerprint and created_at > now() - interval '10 minutes'
  ) or (
    select count(*) from public.leads
    where public.leads.email = normalized_email and created_at > now() - interval '1 hour'
  ) >= 3 then
    return true;
  end if;

  insert into public.leads (
    organization_id, full_name, email, phone, company, service_interest,
    message, landing_path, utm_source, utm_medium, utm_campaign, utm_content,
    utm_term, submission_fingerprint
  ) values (
    target_organization_id, trim(full_name), normalized_email, nullif(trim(phone), ''),
    nullif(trim(company), ''), service_interest, trim(message), landing_path,
    nullif(trim(utm_source), ''), nullif(trim(utm_medium), ''),
    nullif(trim(utm_campaign), ''), nullif(trim(utm_content), ''),
    nullif(trim(utm_term), ''), fingerprint
  );

  return true;
end;
$$;

revoke all on function public.submit_public_lead(text, text, text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.submit_public_lead(text, text, text, text, text, text, text, text, text, text, text, text) to anon;

comment on table public.leads is 'Public contact requests. Migrations are the schema source of truth.';
comment on function public.submit_public_lead(text, text, text, text, text, text, text, text, text, text, text, text) is 'Validated public boundary for lead capture; callers cannot choose organization or workflow status.';

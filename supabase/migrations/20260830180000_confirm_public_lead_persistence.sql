drop function public.submit_public_lead(text, text, text, text, text, text, text, text, text, text, text, text);

create function public.submit_public_lead(
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
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_organization_id uuid;
  normalized_email text := lower(trim(email));
  fingerprint text;
  persisted_lead_id uuid;
begin
  select id into target_organization_id
  from public.organizations
  where slug = 'devora-studio';

  if target_organization_id is null then
    return 'organization_not_found';
  end if;

  fingerprint := md5(normalized_email || '|' || lower(trim(message)));
  perform pg_advisory_xact_lock(hashtextextended(normalized_email, 0));

  if exists (
    select 1 from public.leads
    where submission_fingerprint = fingerprint and created_at > now() - interval '10 minutes'
  ) then
    return 'duplicate';
  end if;

  if (
    select count(*) from public.leads
    where public.leads.email = normalized_email and created_at > now() - interval '1 hour'
  ) >= 3 then
    return 'rate_limited';
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
  ) returning id into persisted_lead_id;

  if persisted_lead_id is null then
    raise exception 'Lead persistence was not confirmed.' using errcode = 'P0001';
  end if;

  return 'persisted';
end;
$$;

revoke all on function public.submit_public_lead(text, text, text, text, text, text, text, text, text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.submit_public_lead(text, text, text, text, text, text, text, text, text, text, text, text) to anon;

comment on function public.submit_public_lead(text, text, text, text, text, text, text, text, text, text, text, text) is 'Validated public lead capture boundary with an explicit persistence outcome.';

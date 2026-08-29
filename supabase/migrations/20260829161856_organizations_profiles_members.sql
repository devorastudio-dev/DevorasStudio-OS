create type public.organization_member_status as enum (
  'invited',
  'active',
  'suspended'
);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated, service_role;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_name_not_blank check (
    char_length(btrim(name)) between 1 and 160
  ),
  constraint organizations_slug_format check (
    char_length(slug) between 1 and 63
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint organizations_slug_key unique (slug)
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_full_name_valid check (
    full_name is null
    or char_length(btrim(full_name)) between 1 and 160
  ),
  constraint profiles_avatar_url_valid check (
    avatar_url is null
    or char_length(btrim(avatar_url)) between 1 and 2048
  )
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  status public.organization_member_status not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_organization_user_key unique (
    organization_id,
    user_id
  )
);

create index organization_members_user_id_idx
  on public.organization_members (user_id);

create index organization_members_organization_status_idx
  on public.organization_members (organization_id, status);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function private.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function private.set_updated_at();

create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'avatar_url', '')), '')
  );

  return new;
end;
$$;

create trigger auth_user_created_create_profile
after insert on auth.users
for each row execute function private.handle_new_auth_user();

-- Cria perfis para usuarios que ja existam quando a migracao for aplicada.
insert into public.profiles (id, full_name, avatar_url)
select
  users.id,
  nullif(btrim(coalesce(users.raw_user_meta_data ->> 'full_name', '')), ''),
  nullif(btrim(coalesce(users.raw_user_meta_data ->> 'avatar_url', '')), '')
from auth.users as users
on conflict (id) do nothing;

create function private.is_active_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members as membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  );
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;

create policy "authenticated users read own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "authenticated users update own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "active members read their organizations"
on public.organizations
for select
to authenticated
using ((select private.is_active_organization_member(id)));

create policy "active members read memberships in their organizations"
on public.organization_members
for select
to authenticated
using ((select private.is_active_organization_member(organization_id)));

revoke all on table public.organizations from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.organization_members from anon, authenticated;

grant select on table public.organizations to authenticated;
grant select on table public.profiles to authenticated;
grant update (full_name, avatar_url) on table public.profiles to authenticated;
grant select on table public.organization_members to authenticated;

revoke all on function private.set_updated_at() from public, anon, authenticated, service_role;
revoke all on function private.handle_new_auth_user() from public, anon, authenticated, service_role;
revoke all on function private.is_active_organization_member(uuid) from public, anon, authenticated, service_role;

grant usage on schema private to authenticated;
grant execute on function private.is_active_organization_member(uuid) to authenticated;

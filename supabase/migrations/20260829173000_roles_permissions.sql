create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text not null,
  created_at timestamptz not null default now(),
  constraint permissions_key_format check (key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  constraint permissions_description_not_blank check (char_length(btrim(description)) between 1 and 240)
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  slug text not null,
  description text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_name_not_blank check (char_length(btrim(name)) between 1 and 80),
  constraint roles_slug_format check (slug ~ '^[a-z][a-z0-9-]{0,62}$'),
  constraint roles_description_not_blank check (char_length(btrim(description)) between 1 and 240),
  constraint roles_organization_slug_key unique (organization_id, slug),
  constraint roles_id_organization_key unique (id, organization_id)
);

create table public.role_permissions (
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_id uuid not null references public.permissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

alter table public.organization_members
add constraint organization_members_id_organization_key unique (id, organization_id);

create table public.organization_member_roles (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  membership_id uuid not null,
  role_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (membership_id, role_id),
  constraint organization_member_roles_membership_fk foreign key (membership_id, organization_id)
    references public.organization_members (id, organization_id) on delete cascade,
  constraint organization_member_roles_role_fk foreign key (role_id, organization_id)
    references public.roles (id, organization_id) on delete cascade
);

create index roles_organization_id_idx on public.roles (organization_id);
create index role_permissions_permission_id_idx on public.role_permissions (permission_id);
create index organization_member_roles_role_id_idx on public.organization_member_roles (role_id);
create index organization_member_roles_organization_id_idx on public.organization_member_roles (organization_id);

create trigger roles_set_updated_at before update on public.roles
for each row execute function private.set_updated_at();

insert into public.permissions (key, description) values
  ('organization.read', 'Consultar a organizacao atual.'),
  ('organization.update', 'Alterar configuracoes da organizacao.'),
  ('members.read', 'Consultar membros da organizacao.'),
  ('members.invite', 'Convidar novos membros.'),
  ('members.manage', 'Suspender e administrar membros.'),
  ('roles.read', 'Consultar papeis e sua matriz.'),
  ('roles.manage', 'Atribuir e remover papeis.'),
  ('crm.read', 'Consultar o CRM futuro.'),
  ('crm.write', 'Operar o CRM futuro.'),
  ('clients.read', 'Consultar clientes futuros.'),
  ('clients.write', 'Operar clientes futuros.'),
  ('proposals.read', 'Consultar propostas futuras.'),
  ('proposals.create', 'Criar propostas futuras.'),
  ('proposals.approve', 'Aprovar propostas futuras.'),
  ('projects.read', 'Consultar projetos futuros.'),
  ('projects.write', 'Operar projetos futuros.'),
  ('financial.read', 'Consultar o financeiro futuro.'),
  ('financial.write', 'Operar o financeiro futuro.'),
  ('products.read', 'Consultar produtos futuros.'),
  ('products.write', 'Operar produtos futuros.'),
  ('audit.read', 'Consultar a auditoria futura.');

create function private.seed_system_roles(target_organization_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.roles (organization_id, name, slug, description, is_system) values
    (target_organization_id, 'Administrador', 'administrador', 'Administracao completa da organizacao.', true),
    (target_organization_id, 'Socio', 'socio', 'Gestao comercial e operacional ampla.', true),
    (target_organization_id, 'Colaborador', 'colaborador', 'Operacao cotidiana sem administracao ou financeiro global.', true),
    (target_organization_id, 'Financeiro', 'financeiro', 'Operacao financeira sem administracao de acessos.', true)
  on conflict (organization_id, slug) do nothing;

  insert into public.role_permissions (role_id, permission_id)
  select role.id, permission.id from public.roles role cross join public.permissions permission
  where role.organization_id = target_organization_id and role.slug = 'administrador'
  on conflict do nothing;

  insert into public.role_permissions (role_id, permission_id)
  select role.id, permission.id from public.roles role join public.permissions permission on permission.key = any (array[
    'organization.read','members.read','members.invite','roles.read','crm.read','crm.write','clients.read','clients.write',
    'proposals.read','proposals.create','proposals.approve','projects.read','projects.write','financial.read','financial.write',
    'products.read','products.write'
  ]) where role.organization_id = target_organization_id and role.slug = 'socio'
  on conflict do nothing;

  insert into public.role_permissions (role_id, permission_id)
  select role.id, permission.id from public.roles role join public.permissions permission on permission.key = any (array[
    'organization.read','members.read','crm.read','crm.write','clients.read','clients.write','proposals.read','proposals.create',
    'projects.read','projects.write','products.read'
  ]) where role.organization_id = target_organization_id and role.slug = 'colaborador'
  on conflict do nothing;

  insert into public.role_permissions (role_id, permission_id)
  select role.id, permission.id from public.roles role join public.permissions permission on permission.key = any (array[
    'organization.read','clients.read','financial.read','financial.write'
  ]) where role.organization_id = target_organization_id and role.slug = 'financeiro'
  on conflict do nothing;
end;
$$;

create function private.seed_system_roles_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin perform private.seed_system_roles(new.id); return new; end;
$$;

create trigger organizations_seed_system_roles after insert on public.organizations
for each row execute function private.seed_system_roles_trigger();

do $$ declare organization record; begin
  for organization in select id from public.organizations loop
    perform private.seed_system_roles(organization.id);
  end loop;
end $$;

create function private.has_permission(permission_key text, target_organization_id uuid default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.has_aal2()) and exists (
    select 1 from public.organization_members membership
    join public.organization_member_roles member_role on member_role.membership_id = membership.id
    join public.role_permissions role_permission on role_permission.role_id = member_role.role_id
    join public.permissions permission on permission.id = role_permission.permission_id
    where membership.user_id = (select auth.uid()) and membership.status = 'active'
      and (target_organization_id is null or membership.organization_id = target_organization_id)
      and permission.key = permission_key
  );
$$;

create function public.has_permission(permission_key text, organization_id uuid default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_permission(permission_key, organization_id);
$$;

create function public.has_role(target_role_slug text, target_organization_id uuid default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select private.has_aal2()) and exists (
    select 1 from public.organization_members membership
    join public.organization_member_roles member_role on member_role.membership_id = membership.id
    join public.roles role on role.id = member_role.role_id
    where membership.user_id = (select auth.uid()) and membership.status = 'active'
      and (target_organization_id is null or membership.organization_id = target_organization_id)
      and role.slug = target_role_slug
  );
$$;

create function public.assign_member_role(target_membership_id uuid, target_role_slug text)
returns void language plpgsql security definer set search_path = '' as $$
declare operator_membership public.organization_members; target public.organization_members; target_role public.roles;
begin
  select * into operator_membership from public.organization_members
  where user_id = auth.uid() and status = 'active';
  if operator_membership.id is null or not private.has_permission('roles.manage', operator_membership.organization_id) then raise exception 'Operation not permitted.'; end if;
  select * into target from public.organization_members where id = target_membership_id and organization_id = operator_membership.organization_id;
  if target.id is null or target.user_id = auth.uid() then raise exception 'Operation not permitted.'; end if;
  select * into target_role from public.roles where organization_id = operator_membership.organization_id and slug = target_role_slug;
  if target_role.id is null then raise exception 'Operation not permitted.'; end if;
  insert into public.organization_member_roles (organization_id, membership_id, role_id)
  values (operator_membership.organization_id, target.id, target_role.id) on conflict do nothing;
end;
$$;

create function private.protect_last_active_administrator() returns trigger
language plpgsql security definer set search_path = '' as $$
declare removed_slug text; active_admins integer;
begin
  select slug into removed_slug from public.roles where id = old.role_id;
  if removed_slug = 'administrador' then
    select count(*) into active_admins from public.organization_member_roles member_role
    join public.organization_members membership on membership.id = member_role.membership_id
    join public.roles role on role.id = member_role.role_id
    where member_role.organization_id = old.organization_id and membership.status = 'active'
      and role.slug = 'administrador' and member_role.membership_id <> old.membership_id;
    if active_admins = 0 then raise exception 'The last active administrator cannot be removed.'; end if;
  end if;
  return old;
end;
$$;

create trigger organization_member_roles_protect_last_admin before delete on public.organization_member_roles
for each row execute function private.protect_last_active_administrator();

create function private.protect_last_administrator_membership() returns trigger
language plpgsql security definer set search_path = '' as $$
declare is_admin boolean; other_admins integer;
begin
  if old.status <> 'active' or (tg_op = 'UPDATE' and new.status = 'active') then
    if tg_op = 'DELETE' then return old; else return new; end if;
  end if;
  select exists (
    select 1 from public.organization_member_roles member_role join public.roles role on role.id = member_role.role_id
    where member_role.membership_id = old.id and role.slug = 'administrador'
  ) into is_admin;
  if is_admin then
    select count(*) into other_admins from public.organization_member_roles member_role
    join public.organization_members membership on membership.id = member_role.membership_id
    join public.roles role on role.id = member_role.role_id
    where membership.organization_id = old.organization_id and membership.status = 'active'
      and membership.id <> old.id and role.slug = 'administrador';
    if other_admins = 0 then raise exception 'The last active administrator cannot be removed.'; end if;
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

create trigger organization_members_protect_last_admin before update of status on public.organization_members
for each row execute function private.protect_last_administrator_membership();

create function public.remove_member_role(target_membership_id uuid, target_role_slug text)
returns void language plpgsql security definer set search_path = '' as $$
declare operator_membership public.organization_members; target public.organization_members; target_role public.roles;
begin
  select * into operator_membership from public.organization_members where user_id = auth.uid() and status = 'active';
  if operator_membership.id is null or not private.has_permission('roles.manage', operator_membership.organization_id) then raise exception 'Operation not permitted.'; end if;
  select * into target from public.organization_members where id = target_membership_id and organization_id = operator_membership.organization_id;
  if target.id is null or target.user_id = auth.uid() then raise exception 'Operation not permitted.'; end if;
  select * into target_role from public.roles where organization_id = operator_membership.organization_id and slug = target_role_slug;
  if target_role.id is null then raise exception 'Operation not permitted.'; end if;
  delete from public.organization_member_roles where membership_id = target.id and role_id = target_role.id;
end;
$$;

alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.organization_member_roles enable row level security;

create policy "authorized members read permissions" on public.permissions for select to authenticated
using ((select private.has_permission('roles.read', null)));
create policy "authorized members read organization roles" on public.roles for select to authenticated
using ((select private.has_permission('roles.read', organization_id)));
create policy "authorized members read organization role permissions" on public.role_permissions for select to authenticated
using (exists (select 1 from public.roles role where role.id = role_id and private.has_permission('roles.read', role.organization_id)));
create policy "authorized members read organization member roles" on public.organization_member_roles for select to authenticated
using ((select private.has_permission('roles.read', organization_id)));

revoke all on table public.permissions, public.roles, public.role_permissions, public.organization_member_roles from anon, authenticated;
grant select on table public.permissions, public.roles, public.role_permissions, public.organization_member_roles to authenticated;

revoke all on function private.seed_system_roles(uuid), private.seed_system_roles_trigger(), private.has_permission(text, uuid), private.protect_last_active_administrator(), private.protect_last_administrator_membership() from public, anon, authenticated, service_role;
revoke all on function public.has_permission(text, uuid), public.has_role(text, uuid), public.assign_member_role(uuid, text), public.remove_member_role(uuid, text) from public, anon, authenticated, service_role;
grant execute on function private.has_permission(text, uuid) to authenticated;
grant execute on function public.has_permission(text, uuid), public.has_role(text, uuid), public.assign_member_role(uuid, text), public.remove_member_role(uuid, text) to authenticated;

alter policy "active members read their organizations" on public.organizations
using ((select private.has_permission('organization.read', id)));

alter policy "active members read memberships in their organizations" on public.organization_members
using ((select private.has_permission('members.read', organization_id)));

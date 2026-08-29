begin;

create extension if not exists pgtap with schema extensions;

select plan(33);

insert into public.organizations (id, name, slug)
values
  ('00000000-0000-0000-0000-000000000201', 'Organizacao Ficticia Um', 'organizacao-ficticia-um'),
  ('00000000-0000-0000-0000-000000000202', 'Organizacao Ficticia Dois', 'organizacao-ficticia-dois');

insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values
  (
    '00000000-0000-0000-0000-000000000101',
    'membro-um@example.invalid',
    '{"full_name":"Membro Ficticio Um","avatar_url":"https://example.invalid/avatar-um.png"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'membro-dois@example.invalid',
    '{"full_name":"Membro Ficticio Dois"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'membro-suspenso@example.invalid',
    '{}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'membro-removido@example.invalid',
    '{"full_name":"Membro a Remover"}',
    now(),
    now()
  );

insert into public.organization_members (organization_id, user_id, status)
values
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000102',
    'active'
  ),
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000103',
    'suspended'
  ),
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000104',
    'active'
  );

insert into public.organization_member_roles (organization_id, membership_id, role_id)
select membership.organization_id, membership.id, role.id
from public.organization_members membership
join public.roles role on role.organization_id = membership.organization_id and role.slug = 'colaborador'
where membership.status = 'active';

update public.profiles
set updated_at = '2000-01-01 00:00:00+00'
where id = '00000000-0000-0000-0000-000000000101';

select has_trigger(
  'public',
  'organizations',
  'organizations_set_updated_at',
  'organizations possui trigger de updated_at'
);

select has_trigger(
  'public',
  'profiles',
  'profiles_set_updated_at',
  'profiles possui trigger de updated_at'
);

select has_trigger(
  'public',
  'organization_members',
  'organization_members_set_updated_at',
  'organization_members possui trigger de updated_at'
);

select has_index(
  'public',
  'organization_members',
  'organization_members_organization_user_key',
  'indice unico cobre organizacao e usuario'
);

select has_index(
  'public',
  'organization_members',
  'organization_members_user_id_idx',
  'indice cobre consultas por usuario'
);

select has_index(
  'public',
  'organization_members',
  'organization_members_organization_status_idx',
  'indice cobre consultas por organizacao e status'
);

select throws_ok(
  $$insert into public.organizations (name, slug) values ('Organizacao Invalida', 'Slug Invalido')$$,
  '23514',
  'new row for relation "organizations" violates check constraint "organizations_slug_format"',
  'slug fora do formato e rejeitado'
);

select throws_ok(
  $$insert into public.organizations (name, slug) values ('   ', 'nome-vazio')$$,
  '23514',
  'new row for relation "organizations" violates check constraint "organizations_name_not_blank"',
  'nome vazio e rejeitado'
);

set local role anon;

select throws_ok(
  $$select * from public.organizations$$,
  '42501',
  'permission denied for table organizations',
  'anonimo nao le organizacoes'
);

select throws_ok(
  $$select * from public.profiles$$,
  '42501',
  'permission denied for table profiles',
  'anonimo nao le perfis'
);

select throws_ok(
  $$select * from public.organization_members$$,
  '42501',
  'permission denied for table organization_members',
  'anonimo nao le membros'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.aal', 'aal2', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000101","role":"authenticated","aal":"aal2"}', true);

select results_eq(
  $$select id from public.profiles$$,
  $$values ('00000000-0000-0000-0000-000000000101'::uuid)$$,
  'usuario autenticado le somente o proprio perfil'
);

update public.profiles
set full_name = 'Alteracao Indevida'
where id = '00000000-0000-0000-0000-000000000102';

reset role;

select is(
  (select full_name from public.profiles where id = '00000000-0000-0000-0000-000000000102'),
  'Membro Ficticio Dois',
  'usuario nao altera perfil alheio'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
select set_config('request.jwt.claim.aal', 'aal2', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000101","role":"authenticated","aal":"aal2"}', true);

select throws_ok(
  $$update public.profiles set id = '00000000-0000-0000-0000-000000000109' where id = '00000000-0000-0000-0000-000000000101'$$,
  '42501',
  'permission denied for table profiles',
  'usuario nao altera campos protegidos do proprio perfil'
);

update public.profiles
set full_name = 'Nome Permitido', avatar_url = null
where id = '00000000-0000-0000-0000-000000000101';

select is(
  (select full_name from public.profiles),
  'Nome Permitido',
  'usuario atualiza campos permitidos do proprio perfil'
);

select cmp_ok(
  (select updated_at from public.profiles),
  '>',
  '2000-01-01 00:00:00+00'::timestamptz,
  'atualizacao permitida renova updated_at'
);

select results_eq(
  $$select slug from public.organizations order by slug$$,
  $$values ('organizacao-ficticia-um'::text)$$,
  'membro ativo le somente sua organizacao'
);

select is(
  (select count(*)::integer from public.organization_members),
  3,
  'membro ativo le somente vinculos da propria organizacao sem recursao'
);

select throws_ok(
  $$insert into public.organization_members (organization_id, user_id, status) values ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', 'active')$$,
  '42501',
  'permission denied for table organization_members',
  'usuario nao adiciona a si mesmo a outra organizacao'
);

select throws_ok(
  $$insert into public.organization_members (organization_id, user_id, status) values ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000102', 'active')$$,
  '42501',
  'permission denied for table organization_members',
  'usuario nao cria associacao para outra pessoa'
);

select throws_ok(
  $$update public.organization_members set status = 'suspended' where user_id = '00000000-0000-0000-0000-000000000101'$$,
  '42501',
  'permission denied for table organization_members',
  'usuario nao altera o proprio vinculo'
);

select throws_ok(
  $$insert into public.organizations (name, slug) values ('Organizacao Indevida', 'organizacao-indevida')$$,
  '42501',
  'permission denied for table organizations',
  'usuario comum nao cria organizacoes'
);

select is(
  (
    select count(*)::integer
    from public.organization_members
    where organization_id = '00000000-0000-0000-0000-000000000202'
  ),
  0,
  'membro nao consulta membros de outra organizacao'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);
select set_config('request.jwt.claim.aal', 'aal2', true);

select is(
  (select count(*)::integer from public.organizations),
  0,
  'membro suspenso nao acessa organizacoes'
);

select is(
  (select count(*)::integer from public.organization_members),
  0,
  'membro suspenso nao acessa vinculos'
);

reset role;

select throws_ok(
  $$insert into public.organization_members (organization_id, user_id, status) values ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'active')$$,
  '23505',
  'duplicate key value violates unique constraint "organization_members_organization_user_key"',
  'duplicidade de organizacao e usuario e rejeitada'
);

select throws_ok(
  $$insert into public.organization_members (organization_id, user_id, status) values ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000103', 'invalid')$$,
  '22P02',
  'invalid input value for enum organization_member_status: "invalid"',
  'status invalido e rejeitado'
);

select is(
  (
    select full_name
    from public.profiles
    where id = '00000000-0000-0000-0000-000000000101'
  ),
  'Nome Permitido',
  'trigger cria perfil e permite atualizar nome'
);

select is(
  (
    select avatar_url
    from public.profiles
    where id = '00000000-0000-0000-0000-000000000102'
  ),
  null,
  'trigger trata avatar ausente'
);

select is(
  (
    select full_name
    from public.profiles
    where id = '00000000-0000-0000-0000-000000000103'
  ),
  null,
  'trigger trata nome ausente'
);

delete from auth.users
where id = '00000000-0000-0000-0000-000000000104';

select is(
  (
    select count(*)::integer
    from public.profiles
    where id = '00000000-0000-0000-0000-000000000104'
  ),
  0,
  'excluir usuario remove seu perfil'
);

select is(
  (
    select count(*)::integer
    from public.organization_members
    where user_id = '00000000-0000-0000-0000-000000000104'
  ),
  0,
  'excluir usuario remove seus vinculos'
);

select is(
  (
    select count(*)::integer
    from public.profiles
  ),
  3,
  'trigger criou um perfil para cada usuario restante'
);

select * from finish();

rollback;

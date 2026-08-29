begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

insert into public.organizations (id, name, slug)
values
  ('00000000-0000-0000-0000-000000000301', 'Convite Ficticio Um', 'convite-ficticio-um'),
  ('00000000-0000-0000-0000-000000000302', 'Convite Ficticio Dois', 'convite-ficticio-dois');

insert into auth.users (id, email, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000111', 'convidado@example.invalid', now(), now()),
  ('00000000-0000-0000-0000-000000000112', 'suspenso@example.invalid', now(), now()),
  ('00000000-0000-0000-0000-000000000113', 'sem-vinculo@example.invalid', now(), now()),
  ('00000000-0000-0000-0000-000000000114', 'conflito@example.invalid', now(), now());

insert into public.organization_members (organization_id, user_id, status)
values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000111', 'invited'),
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000112', 'suspended'),
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000114', 'invited'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000114', 'invited');

set local role anon;

select throws_ok(
  $$select public.accept_my_organization_invitation()$$,
  '42501',
  'permission denied for function accept_my_organization_invitation',
  'anonimo nao executa aceite de convite'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000111', true);

select is(
  public.accept_my_organization_invitation(),
  '00000000-0000-0000-0000-000000000301'::uuid,
  'convidado ativa somente o vinculo preparado para sua identidade'
);

reset role;

select is(
  (
    select status
    from public.organization_members
    where user_id = '00000000-0000-0000-0000-000000000111'
  ),
  'active'::public.organization_member_status,
  'aceite altera status para ativo'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000111', true);

select throws_ok(
  $$select public.accept_my_organization_invitation()$$,
  'P0001',
  'Invitation cannot be accepted.',
  'aceite repetido nao altera vinculo ativo'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000112', true);

select throws_ok(
  $$select public.accept_my_organization_invitation()$$,
  'P0001',
  'Invitation cannot be accepted.',
  'membro suspenso nao reativa acesso pelo convite'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000113', true);

select throws_ok(
  $$select public.accept_my_organization_invitation()$$,
  'P0001',
  'Invitation cannot be accepted.',
  'usuario sem vinculo nao escolhe organizacao'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000114', true);

select throws_ok(
  $$select public.accept_my_organization_invitation()$$,
  'P0001',
  'Invitation cannot be accepted.',
  'vinculos conflitantes impedem aceite ambiguo'
);

reset role;

select is(
  (
    select count(*)::integer
    from public.organization_members
    where user_id = '00000000-0000-0000-0000-000000000114'
      and status = 'active'
  ),
  0,
  'conflito nao ativa nenhuma organizacao'
);

select function_returns(
  'public',
  'accept_my_organization_invitation',
  array[]::text[],
  'uuid',
  'funcao de aceite nao recebe organizacao do navegador'
);

select * from finish();

rollback;

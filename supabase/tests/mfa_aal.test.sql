begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

insert into public.organizations (id, name, slug)
values ('00000000-0000-4000-8000-000000000401', 'MFA Ficticio', 'mfa-ficticio');

insert into auth.users (id, email, created_at, updated_at)
values ('00000000-0000-4000-8000-000000000402', 'mfa@example.invalid', now(), now());

insert into public.organization_members (organization_id, user_id, status)
values (
  '00000000-0000-4000-8000-000000000401',
  '00000000-0000-4000-8000-000000000402',
  'active'
);

set local role anon;

select throws_ok(
  $$select * from public.get_my_membership_statuses()$$,
  '42501',
  'permission denied for function get_my_membership_statuses',
  'anonimo nao consulta o proprio vinculo'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000402', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config('request.jwt.claim.aal', 'aal1', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000402","role":"authenticated","aal":"aal1"}', true);

select results_eq(
  $$select * from public.get_my_membership_statuses()$$,
  $$values ('active'::public.organization_member_status)$$,
  'AAL1 consulta somente o estado do proprio vinculo para roteamento'
);

select is((select count(*)::integer from public.organizations), 0, 'AAL1 nao le organizacao');
select is((select count(*)::integer from public.organization_members), 0, 'AAL1 nao le membros');

select set_config('request.jwt.claim.aal', 'aal2', true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000402","role":"authenticated","aal":"aal2"}', true);

select results_eq(
  $$select id from public.organizations$$,
  $$values ('00000000-0000-4000-8000-000000000401'::uuid)$$,
  'AAL2 libera a organizacao do membro ativo'
);

select is(
  (select count(*)::integer from public.organization_members),
  1,
  'AAL2 libera vinculos sob a RLS existente'
);

select * from finish();

rollback;

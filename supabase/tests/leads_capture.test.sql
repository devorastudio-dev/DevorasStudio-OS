begin;
select plan(13);

create extension if not exists pgtap with schema extensions;

insert into auth.users (id, email, created_at, updated_at) values
  ('10000000-0000-0000-0000-000000000011', 'lead-reader@example.invalid', now(), now()),
  ('10000000-0000-0000-0000-000000000012', 'outsider@example.invalid', now(), now());

insert into public.organizations (id, name, slug)
values ('10000000-0000-0000-0000-000000000001', 'Devora Studio', 'devora-studio'),
       ('10000000-0000-0000-0000-000000000002', 'Other', 'other');

insert into public.organization_members (organization_id, user_id, status)
values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000011', 'active');

insert into public.organization_member_roles (organization_id, membership_id, role_id)
select m.organization_id, m.id, r.id from public.organization_members m
join public.roles r on r.organization_id = m.organization_id and r.slug = 'colaborador'
where m.user_id = '10000000-0000-0000-0000-000000000011';

set local role anon;
select lives_ok($$ select public.submit_public_lead('Maria Silva', 'MARIA@example.com', '', '', 'automation', 'Mensagem suficientemente longa para contato.', '/', 'google', null, null, null, null) $$, 'anonymous visitor submits through restricted RPC');
select throws_ok($$ insert into public.leads (organization_id, full_name, email, service_interest, message, submission_fingerprint) values ('10000000-0000-0000-0000-000000000001', 'Direct Insert', 'direct@example.com', 'other', 'Mensagem suficientemente longa para contato.', md5('x')) $$, '42501', null, 'anonymous direct insert is denied');
select throws_ok($$ select * from public.leads $$, '42501', 'permission denied for table leads', 'anonymous cannot read leads');
reset role;

select is((select count(*) from public.leads where email = 'maria@example.com'), 1::bigint, 'RPC normalizes and stores the lead');
select is((select organization_id from public.leads where email = 'maria@example.com'), '10000000-0000-0000-0000-000000000001'::uuid, 'RPC resolves the fixed organization');
select is((select status from public.leads where email = 'maria@example.com'), 'new', 'RPC controls workflow status');

set local role anon;
select public.submit_public_lead('Maria Silva', 'maria@example.com', '', '', 'automation', 'Mensagem suficientemente longa para contato.', '/', null, null, null, null, null);
reset role;
select is((select count(*) from public.leads where email = 'maria@example.com'), 1::bigint, 'duplicate submission is idempotent');

select throws_ok($$ insert into public.leads (organization_id, full_name, email, service_interest, message, submission_fingerprint) values ('10000000-0000-0000-0000-000000000001', 'A', 'invalid', 'unknown', 'short', md5('x')) $$, '23514', null, 'database constraints reject invalid payload');

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000012","role":"authenticated","aal":"aal2"}',true);
select is((select count(*) from public.leads), 0::bigint, 'user without membership cannot read leads');

select set_config('request.jwt.claims','{"sub":"10000000-0000-0000-0000-000000000011","role":"authenticated","aal":"aal2"}',true);
select is((select count(*) from public.leads), 1::bigint, 'member with crm.read reads organization leads');
select throws_ok($$ delete from public.leads $$, '42501', null, 'authenticated users cannot delete leads');
select throws_ok($$ update public.leads set status = 'new' $$, '42501', null, 'authenticated users cannot update leads in C1');

select ok(not has_table_privilege('anon', 'public.leads', 'INSERT'), 'anon has no direct insert grant');

select * from finish();
rollback;
